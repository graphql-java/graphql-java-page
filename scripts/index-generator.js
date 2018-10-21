const promisify = require('util').promisify;
const path = require('path');
const fs = require('fs');
const algoliasearch = require('algoliasearch');

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

const APPLICATION_ID = 'QN236PQQTM';
const API_KEY = process.env.API_KEY;

const contentDir = path.resolve('.', 'content');

const getContentDir = dirPath => path.resolve(contentDir, dirPath);

const generateUrl = (section, fileName) =>
    [section, fileName].join('/').replace('.md', '');

const extractTitle = content => {
    const regex = /title.*\"(.*)\"/;

    const match = regex.exec(content);

    if (match) {
        return match[1];
    }

    return '';
};

const removeMetadata = content =>
    content.replace(/[\-\+]{3}.*[\-\+]{3}/s, '');

const filterShortParagraphs = paragraph => {
    const MIN_PARAGRAPH_LENGTH = 50;

    return paragraph.length >= MIN_PARAGRAPH_LENGTH;
}

const splitParagraphs = content => {
    const LINE_BREAK = '\n';
    return content.split(LINE_BREAK).filter(Boolean);
};

const toNumberVersion = version =>
    Number(version.replace('v', ''))

const indexBlog = async () => 
    indexDir('blog')

const indexDocs = async () => {
    // TODO get active versions from global config
    const ACTIVE_VERSIONS = ['v9', 'v10'];
    const docContentDir = getContentDir('documentation');

    const docDirs = await readdir(docContentDir);

    const promises = docDirs
        .filter(docDir => ACTIVE_VERSIONS.includes(docDir))
        .map(async docDir => {
            if (fs.statSync(path.resolve(docContentDir, docDir)).isDirectory()) {
                const indexedDocs = await indexDir(`documentation/${docDir}`);

                return indexedDocs.map(indexedDoc => ({
                    ...indexedDoc,
                    version: toNumberVersion(docDir)
                }));
            }
        });

    const indexedDirs = await Promise.all(promises);

    return indexedDirs
        .filter(Boolean)
        .reduce((acc, indexedDocs) => acc.concat(indexedDocs));
}

const clearIndex = index =>
    new Promise((resolve, reject) => {
        index.clearIndex((err, content) => {
            if (err) {
                reject(err);
            }

            resolve(content);
        })
    });

const addObjects = (index, objects) =>
    new Promise((resolve, reject) => {
        index.addObjects(objects, (err, content) => {
            if (err) {
                reject(err);
            }

            resolve(content);
        })
    });

const indexDir = async dirPath => {
    const contentDir = getContentDir(dirPath)
    const fileNames = await readdir(contentDir);

    const filePromises = fileNames
        .map(name => ({
            name,
            path: path.resolve(contentDir, name),
            url: generateUrl(dirPath, name)
        }))
        .map(async fileObj => ({
            ...fileObj,
            rawContent: await readFile(fileObj.path, 'utf8')
        }
));

    let fileObjects = await Promise.all(filePromises);

    return fileObjects
        .map(({ url, rawContent }) =>
            splitParagraphs(removeMetadata(rawContent))
                .filter(filterShortParagraphs)
                .map(paragraph => ({
                    url,
                    title: extractTitle(rawContent),
                    content: paragraph
                }))
        )
        .reduce((acc, list) => acc.concat(list));
}

const execute = async () => {
    var client = algoliasearch(APPLICATION_ID, API_KEY);

    var blogsIndex = client.initIndex('blog');
    var docsIndex = client.initIndex('documentation');

    try {
        const indexedBlog = await indexBlog();
        const indexedDocs = await indexDocs();

        await Promise.all([
            clearIndex(blogsIndex).then(() => addObjects(blogsIndex, indexedBlog)),
            clearIndex(docsIndex).then(() => addObjects(docsIndex, indexedDocs))
        ]);
    } catch (err) {
        console.log(err);
    }
}

execute();