---
title: Security
description: Security policy and information
hide_table_of_contents: true
---

# Security

## Supported versions
If a security issue occurs, we will patch the latest version and backport the security patch for versions released in the past 18 months, as stated in our [release policy](https://www.graphql-java.com/blog/release-policy).

These fixes will be backported depending on severity and demand. As security fixes are time sensitive, we will release them on demand instead of waiting for the next scheduled release date.

The maintainers reserve the right to make a pragmatic decision to make adjustments to the security policy.

## Reporting a vulnerability
:::caution
🚨 To report a vulnerability, **DO NOT open a pull request or issue or GitHub discussion. DO NOT post publicly.**

Instead, **report the vulnerability privately** via the **Security tab** on the [graphql-java GitHub repository](https://github.com/graphql-java/graphql-java/security). See instructions at [https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability).
:::

## Disclosure policy
The GraphQL Java maintainers will collaborate with those who report vulnerabilities privately via the [GitHub vulnerability reporting form](https://github.com/graphql-java/graphql-java/security). 
We will acknowledge and review vulnerability reports as soon as we can. **To protect the community, please do not publicly disclose the vulnerability.**
The maintainers will make a public announcement after the vulnerability is fixed. 

Please allow time for the maintainers to review vulnerability reports, please note we are an open source project run by volunteers.

## Common Vulnerabilities and Exposures (CVEs)

[GraphQL Java is the CVE Numbering Authority (CNA)](https://www.cve.org/PartnerInformation/ListofPartners/partner/graphql-java) for GraphQL Java, Java DataLoader, GraphQL Java Extended Scalars, and GraphQL Java Extended Validation.

#### CVE-2024-40094
Patched by versions 21.5, 20.9, 19.11, build version 0.0.0-2024-03-22T04-18-12-97743bc, or later
* [Announcement on GitHub](https://github.com/graphql-java/graphql-java/discussions/3641)
* [CVE link](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2024-40094)

#### CVE-2023-29470
Patched by versions 20.2, 19.5, 18.5, 17.6, build version 0.0.0-2023-03-29T23-54-31-fabc3e0, or later
* [Announcement on GitHub](https://github.com/graphql-java/graphql-java/discussions/3181)
* [CVE link](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-29470)

#### CVE-2023-28867
Patched by versions 20.1, 19.4, 18.4, 17.5, build version 0.0.0-2023-03-20T01-49-44-80e3135, or later
* [Announcement on GitHub](https://github.com/graphql-java/graphql-java/discussions/3153)
* [CVE link](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-28867)

#### CVE-2022-37734
Patched by versions 19.0, 18.3, 17.4, build version 0.0.0-2022-07-26T05-45-04-226aabd9, or later
* [Announcement on GitHub](https://github.com/graphql-java/graphql-java/discussions/2958)
* [CVE link](https://cve.mitre.org/cgi-bin/cvename.cgi?name=2022-37734)
