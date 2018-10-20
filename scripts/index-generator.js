const promisify = require('util').promisify;
const path = require('path');
const fs = require('fs');
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const exists = promisify(fs.exists);
const mkdir = promisify(fs.mkdir);

const contentDir = path.resolve('.', 'content');

const getContentDir = dirPath => path.resolve(contentDir, dirPath);

const baseUrl = 'https://www.graphql-java.com';

const generateUrl = (section, fileName) =>
    [baseUrl, section, fileName].join('/').replace('.md', '');

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

const truncate = content => {
    const MAX_CONTENT_LENGTH = 1000;
    return content
        .substring(0, MAX_CONTENT_LENGTH);
};

const indexBlog = async () => {
    const indexedBlogs = await indexDir('blog')

    return indexedBlogs.map(indexedBlog => ({
        ...indexedBlog,
        category: 'Blogs'
    }));
}

const indexDocs = async () => {
    const docContentDir = getContentDir('documentation');

    const docDirs = await readdir(docContentDir)

    const promises = docDirs.map(docDir => {
        if (fs.statSync(path.resolve(docContentDir, docDir)).isDirectory()) {
            return indexDir(`documentation/${docDir}`);
        }
    });

    const indexedDirs = await Promise.all(promises);

    return indexedDirs
        .filter(Boolean)
        .reduce((acc, indexedDocs) => acc.concat(indexedDocs))
        .map(indexedDoc => ({
            ...indexedDoc,
            category: 'Documentation'
        }));
}

const execute = async () => {
    const OUTPUT_DIR = path.resolve('.', 'dist');

    const indexedBlog = await indexBlog();
    const indexedDocs = await indexDocs();
    const indexedAll = indexedBlog.concat(indexedDocs);

    if (!(await exists(OUTPUT_DIR))) {
        await mkdir(OUTPUT_DIR);
    }

    await writeFile(path.resolve(OUTPUT_DIR, 'algolia-index.json'), JSON.stringify(indexedAll));
}

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

    return fileObjects.map(({ name, path, url, rawContent }) => ({
        name,
        path,
        url,
        title: extractTitle(rawContent),
        content: truncate(removeMetadata(rawContent))
    }));
}

execute();