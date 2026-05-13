import React from 'react';
import Link from '@docusaurus/Link';
import ExtIcon from '../../components/ExtIcon';
import styles from './styles.module.css';

const EXT_LINK = { target: '_blank', rel: 'noopener noreferrer' };
const LOGO_URL = '/img/logo.png';
const YEAR = new Date().getFullYear();

function FooterExtIcon() {
  return <ExtIcon style={{ top: '-2px' }} />;
}

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.grid}>
          <div className={styles.brand}>
            <div className={styles.logoRow}>
              <img src={LOGO_URL} alt="GraphQL Java" className={styles.logo} />
              <span className={styles.brandName}>GraphQL Java</span>
            </div>
            <p className={styles.brandDesc}>
              The Java implementation of GraphQL. Created and maintained by Andreas Marek and contributors.
            </p>
          </div>

          <div>
            <div className={styles.colHeader}>Docs</div>
            <ul className={styles.links}>
              <li><Link className={styles.link} to="/documentation/getting-started">Documentation</Link></li>
              <li><Link className={styles.link} to="/tutorials/getting-started-with-spring-boot">3 Min Tutorial</Link></li>
              <li><a className={styles.link} href="https://javadoc.io/doc/com.graphql-java/graphql-java/" {...EXT_LINK}>JavaDoc<FooterExtIcon /></a></li>
              <li><Link className={styles.link} to="/security">Security</Link></li>
              <li>
                <a className={`${styles.link} ${styles.federationLink}`} href="https://feddi.dev" {...EXT_LINK}>
                  Federation<FooterExtIcon />
                </a>
              </li>
            </ul>
          </div>

          <div>
            <div className={styles.colHeader}>Community</div>
            <ul className={styles.links}>
              <li><a className={styles.link} href="https://github.com/graphql-java/graphql-java/discussions" {...EXT_LINK}>GitHub Discussions<FooterExtIcon /></a></li>
              <li><Link className={styles.link} to="/blog">Blog</Link></li>
              <li><a className={styles.link} href="https://github.com/graphql-java/graphql-java/releases" {...EXT_LINK}>Releases<FooterExtIcon /></a></li>
            </ul>
          </div>

          <div>
            <div className={styles.colHeader}>More</div>
            <ul className={styles.links}>
              <li><a className={styles.link} href="https://github.com/graphql-java/graphql-java" {...EXT_LINK}>GitHub<FooterExtIcon /></a></li>
              <li><a className={styles.link} href="https://leanpub.com/graphql-java/" {...EXT_LINK}>Book<FooterExtIcon /></a></li>
              <li><Link className={styles.link} to="/about">About</Link></li>
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          <span className={styles.copyright}>Copyright © {YEAR} Andreas Marek</span>
          <a className={styles.license} href="https://github.com/graphql-java/graphql-java/blob/master/LICENSE" {...EXT_LINK}>
            MIT License
          </a>
        </div>
      </div>
    </footer>
  );
}
