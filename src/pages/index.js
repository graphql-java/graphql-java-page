import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import ExtIcon from '../components/ExtIcon';
import styles from './index.module.css';

const EXT_LINK = { target: '_blank', rel: 'noopener noreferrer' };

function Hero() {
  return (
    <section className={styles.hero}>
      <h1 className={styles.heroTitle}>GraphQL Java</h1>
      <p className={styles.heroSubtitle}>The Java implementation of GraphQL</p>
      <div className={styles.trustBar}>
        <span>Spring GraphQL</span>
        <span className={styles.dot}>·</span>
        <span>Netflix DGS</span>
        <span className={styles.dot}>·</span>
        <span>Atlassian</span>
        <span className={styles.dot}>·</span>
        <span>1M+ downloads/month</span>
      </div>
      <div className={styles.ctaRow}>
        <Link className={styles.ctaPrimary} to="/documentation/getting-started">
          Get started →
        </Link>
        <a className={styles.ctaSecondary} href="https://feddi.dev" {...EXT_LINK}>
          JVM-native GraphQL federation <ExtIcon />
        </a>
      </div>
    </section>
  );
}

function Card({ title, description, to, href, external }) {
  const content = (
    <>
      <div className={styles.cardTitle}>
        {title}{external && <ExtIcon />}
      </div>
      <div className={styles.cardDesc}>{description}</div>
    </>
  );
  if (to) {
    return <Link className={styles.card} to={to}>{content}</Link>;
  }
  return (
    <a className={styles.card} href={href} {...(external ? EXT_LINK : {})}>
      {content}
    </a>
  );
}

export default function Home() {
  return (
    <Layout title="GraphQL Java" description="The Java implementation of GraphQL">
      <Hero />
      <main className={styles.content}>
        <section className={styles.section}>
          <div className={styles.sectionLabel}>Documentation</div>
          <div className={styles.cardGrid}>
            <Card title="Documentation" description="Full reference for GraphQL Java" to="/documentation/getting-started" />
            <Card title="3 min tutorial" description="Get a GraphQL server running fast" to="/tutorials/getting-started-with-spring-boot" />
            <Card title="GraphQL with Java and Spring" description="Book from the maintainers" href="https://leanpub.com/graphql-java/" external />
            <Card title="JavaDoc" description="Full API reference" href="https://javadoc.io/doc/com.graphql-java/graphql-java/" external />
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionLabel}>Federation</div>
          <div className={styles.federationCard}>
            <div className={styles.federationText}>
              <div className={styles.federationTitle}>JVM-native GraphQL federation</div>
              <div className={styles.federationBody}>
                Andreas Marek, creator of GraphQL Java, is building feddi — a JVM-native federation gateway for any team running GraphQL on the JVM.
              </div>
            </div>
            <a className={styles.federationBtn} href="https://feddi.dev" {...EXT_LINK}>
              feddi.dev <ExtIcon />
            </a>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionLabel}>Community</div>
          <div className={styles.cardGrid}>
            <Card title="GitHub Discussions" description="Ask questions, share ideas" href="https://github.com/graphql-java/graphql-java/discussions" external />
            <Card title="Releases" description="Changelog and release notes" href="https://github.com/graphql-java/graphql-java/releases" external />
          </div>
        </section>
      </main>
    </Layout>
  );
}
