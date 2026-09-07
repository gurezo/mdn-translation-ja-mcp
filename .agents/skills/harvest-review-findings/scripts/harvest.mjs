#!/usr/bin/env node
/**
 * mozilla-japan/translation の閉じた Issue と
 * mdn/translated-content の閉じた l10n-ja PR から人手レビュー指摘を収集する。
 *
 * 用法（リポジトリルートまたはこのディレクトリで）:
 *   node .agents/skills/harvest-review-findings/scripts/harvest.mjs
 *   node harvest.mjs --pr-limit=40 --issue-limit=30 --out /tmp/mdn-review-harvest.json
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const BOT_LOGINS = new Set([
  "github-actions[bot]",
  "github-actions",
  "dependabot[bot]",
  "dependabot",
  "mdn-bot",
]);

const APPROVAL_ONLY =
  /^(OKです[。!]?)|(ありがとうございました[。]?)|(良いと思います[。]?)|(修正ありがとうございました[。]?)|(これでよいと思います[。]?)$/;

const CLOSE_ONLY =
  /レビューしてマージ|クローズします|確認しました。OK|翻訳ミートアップ|目を通します|見ます。$/;

const AUTHOR_CHANGELOG = /^[-*] (feat|fix|refactor|chore):/i;

const GUIDELINE_ISSUE = /表記ゆれ|表記揺れ|ガイドライン|用語の統一|誤訳/;

const PR_URL_RE =
  /https:\/\/github\.com\/mdn\/translated-content\/pull\/(\d+)/g;

const SKILL_RULES = [
  {
    skill: "l10n-guideline",
    re: /sourceCommit|GlossarySidebar|front-matter|l10n\.|原文|意訳|逐語|省略|提示|title:/i,
  },
  {
    skill: "mozilla-l10n-glossary",
    re: /訳語|用語集|glossary|Glossary|計算値|computed value/i,
  },
  {
    skill: "japanese-style",
    re: /です・ます|である|ひらがな|漢字|様々|さまざま|送りがな/,
  },
  {
    skill: "editorial-guideline",
    re: /半角|長音|ブラウザー|約物|スペース|―|～|インターフェイス/,
  },
];

/**
 * @param {string[]} args
 * @returns {{ prLimit: number; issueLimit: number; out: string | undefined }}
 */
export function parseHarvestArgs(args) {
  /** @type {{ prLimit: number; issueLimit: number; out: string | undefined }} */
  const opts = { prLimit: 40, issueLimit: 30, out: undefined };
  for (const arg of args) {
    if (arg.startsWith("--pr-limit=")) {
      opts.prLimit = Number(arg.slice("--pr-limit=".length));
      continue;
    }
    if (arg.startsWith("--issue-limit=")) {
      opts.issueLimit = Number(arg.slice("--issue-limit=".length));
      continue;
    }
    if (arg.startsWith("--out=")) {
      opts.out = arg.slice("--out=".length);
      continue;
    }
    if (arg.startsWith("-")) {
      throw new Error(`不明なオプションです: ${arg}`);
    }
    throw new Error(`不明な引数です: ${arg}`);
  }
  if (!Number.isInteger(opts.prLimit) || opts.prLimit < 1) {
    throw new Error("--pr-limit は 1 以上の整数にしてください");
  }
  if (!Number.isInteger(opts.issueLimit) || opts.issueLimit < 1) {
    throw new Error("--issue-limit は 1 以上の整数にしてください");
  }
  return opts;
}

/**
 * @param {string | undefined} login
 */
export function isBotLogin(login) {
  if (!login) return true;
  return BOT_LOGINS.has(login) || login.endsWith("[bot]");
}

/**
 * @param {{ user?: string; body?: string }} comment
 */
export function isGuidelineIssueBody(body) {
  return GUIDELINE_ISSUE.test(body) && !body.trimStart().startsWith("<!--");
}

/**
 * @param {{ user?: string; body?: string; kind?: string }} comment
 */
export function isNoiseComment(comment) {
  const user = comment.user ?? "";
  const body = (comment.body ?? "").trim();
  if (isBotLogin(user)) return true;
  if (!body) return true;
  if (body.startsWith("<!--")) return true;
  if (/^https?:\/\/\S+$/.test(body)) return true;
  if (body.includes("build_hash:") || body.includes("Preview URLs")) {
    return true;
  }
  if (body.includes("**[mdn-linter]**") || body.includes("reviewdog")) {
    return true;
  }
  if (AUTHOR_CHANGELOG.test(body)) return true;
  if (comment.kind === "issue-body" && !isGuidelineIssueBody(body)) {
    return true;
  }
  if (body.length < 160 && CLOSE_ONLY.test(body)) return true;
  if (body.length < 80 && APPROVAL_ONLY.test(body.split("\n")[0] ?? "")) {
    return true;
  }
  return false;
}

/**
 * @param {string} body
 * @returns {string}
 */
export function classifySkill(body) {
  for (const rule of SKILL_RULES) {
    if (rule.re.test(body)) return rule.skill;
  }
  return "l10n-guideline";
}

/**
 * @param {string} text
 * @returns {number[]}
 */
export function extractPrNumbers(text) {
  const found = new Set();
  for (const match of text.matchAll(PR_URL_RE)) {
    found.add(Number(match[1]));
  }
  return [...found];
}

/**
 * @param {string} query
 * @param {Record<string, string | number | null>} variables
 */
export function runGraphql(query, variables) {
  const args = ["api", "graphql", "-f", `query=${query}`];
  for (const [key, value] of Object.entries(variables)) {
    if (value === null || value === undefined) continue;
    if (typeof value === "number") {
      args.push("-F", `${key}=${value}`);
    } else {
      args.push("-f", `${key}=${value}`);
    }
  }
  const result = spawnSync("gh", args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(
      `gh graphql が失敗しました: ${result.stderr || result.stdout}`,
    );
  }
  const parsed = JSON.parse(result.stdout);
  if (parsed.errors?.length) {
    throw new Error(`GitHub GraphQL エラー: ${JSON.stringify(parsed.errors)}`);
  }
  return parsed.data;
}

const PR_SEARCH_QUERY = `
query($search: String!, $first: Int!, $after: String) {
  search(query: $search, type: ISSUE, first: $first, after: $after) {
    pageInfo { hasNextPage endCursor }
    nodes {
      ... on PullRequest {
        number
        title
        url
        merged
        labels(first: 12) { nodes { name } }
        reviews(first: 30) {
          nodes { author { login } body state }
        }
        comments(first: 20) {
          nodes { author { login } body createdAt url }
        }
        reviewThreads(first: 40) {
          nodes {
            comments(first: 15) {
              nodes { author { login } body path createdAt url }
            }
          }
        }
      }
    }
  }
}
`;

const ISSUE_SEARCH_QUERY = `
query($search: String!, $first: Int!, $after: String) {
  search(query: $search, type: ISSUE, first: $first, after: $after) {
    pageInfo { hasNextPage endCursor }
    nodes {
      ... on Issue {
        number
        title
        url
        body
        labels(first: 12) { nodes { name } }
        comments(first: 20) {
          nodes { author { login } body createdAt url }
        }
      }
    }
  }
}
`;

const PR_BY_NUMBER_QUERY = `
query($number: Int!) {
  repository(owner: "mdn", name: "translated-content") {
    pullRequest(number: $number) {
      number
      title
      url
      merged
      labels(first: 12) { nodes { name } }
      reviews(first: 30) {
        nodes { author { login } body state }
      }
      comments(first: 20) {
        nodes { author { login } body createdAt url }
      }
      reviewThreads(first: 40) {
        nodes {
          comments(first: 15) {
            nodes { author { login } body path createdAt url }
          }
        }
      }
    }
  }
}
`;

/**
 * @param {object} pr
 * @returns {object[]}
 */
export function commentsFromPullRequest(pr) {
  /** @type {object[]} */
  const comments = [];
  const prMeta = {
    prNumber: pr.number,
    prTitle: pr.title,
    prUrl: pr.url,
  };
  for (const thread of pr.reviewThreads?.nodes ?? []) {
    for (const node of thread.comments?.nodes ?? []) {
      comments.push({
        ...prMeta,
        kind: "review-thread",
        user: node.author?.login,
        body: node.body,
        path: node.path,
        createdAt: node.createdAt,
        url: node.url,
      });
    }
  }
  for (const node of pr.reviews?.nodes ?? []) {
    comments.push({
      ...prMeta,
      kind: "review",
      user: node.author?.login,
      body: node.body,
      state: node.state,
    });
  }
  for (const node of pr.comments?.nodes ?? []) {
    comments.push({
      ...prMeta,
      kind: "issue-comment",
      user: node.author?.login,
      body: node.body,
      createdAt: node.createdAt,
      url: node.url,
    });
  }
  return comments;
}

/**
 * @param {object} issue
 */
export function commentsFromIssue(issue) {
  const comments = [];
  const issueMeta = {
    issueNumber: issue.number,
    issueTitle: issue.title,
    issueUrl: issue.url,
  };
  if (issue.body) {
    comments.push({
      ...issueMeta,
      kind: "issue-body",
      user: "issue-author",
      body: issue.body,
    });
  }
  for (const node of issue.comments?.nodes ?? []) {
    comments.push({
      ...issueMeta,
      kind: "issue-comment",
      user: node.author?.login,
      body: node.body,
      createdAt: node.createdAt,
      url: node.url,
    });
  }
  return comments;
}

/**
 * @param {object[]} comments
 */
export function toFindings(comments) {
  return comments
    .filter((comment) => !isNoiseComment(comment))
    .map((comment) => ({
      ...comment,
      skill: classifySkill(comment.body ?? ""),
    }));
}

/**
 * @param {object[]} findings
 */
export function clusterFindings(findings) {
  /** @type {Record<string, object[]>} */
  const clusters = {};
  for (const finding of findings) {
    const skill = finding.skill ?? "l10n-guideline";
    if (!clusters[skill]) clusters[skill] = [];
    clusters[skill].push(finding);
  }
  return clusters;
}

/**
 * @param {string} search
 * @param {string} query
 * @param {number} limit
 */
function searchAll(search, query, limit) {
  /** @type {object[]} */
  const nodes = [];
  let after = null;
  while (nodes.length < limit) {
    const first = Math.min(20, limit - nodes.length);
    const data = runGraphql(query, {
      search,
      first,
      after,
    });
    const page = data.search;
    nodes.push(...page.nodes.filter(Boolean));
    if (!page.pageInfo.hasNextPage) break;
    after = page.pageInfo.endCursor;
  }
  return nodes.slice(0, limit);
}

/**
 * @param {number[]} numbers
 */
function fetchPullRequestsByNumber(numbers) {
  return numbers.map((number) => {
    const data = runGraphql(PR_BY_NUMBER_QUERY, { number });
    return data.repository.pullRequest;
  });
}

/**
 * @param {{ prLimit: number; issueLimit: number }} opts
 */
export function harvestReviewFindings(opts) {
  const issues = searchAll(
    "repo:mozilla-japan/translation is:issue is:closed",
    ISSUE_SEARCH_QUERY,
    opts.issueLimit,
  );

  const listedPrs = searchAll(
    'repo:mdn/translated-content is:pr is:closed label:l10n-ja -label:"automated pr"',
    PR_SEARCH_QUERY,
    opts.prLimit,
  );

  const linked = new Set();
  for (const issue of issues) {
    for (const n of extractPrNumbers(`${issue.body ?? ""}\n${issue.title}`)) {
      linked.add(n);
    }
    for (const comment of issue.comments?.nodes ?? []) {
      for (const n of extractPrNumbers(comment.body ?? "")) {
        linked.add(n);
      }
    }
  }

  const have = new Set(listedPrs.map((pr) => pr.number));
  const missing = [...linked].filter((n) => !have.has(n));
  const extraPrs = missing.length ? fetchPullRequestsByNumber(missing) : [];
  const prs = [...listedPrs, ...extraPrs.filter(Boolean)].filter((pr) => {
    const labels = (pr.labels?.nodes ?? []).map((l) => l.name);
    return !labels.includes("automated pr");
  });

  const rawComments = [
    ...issues.flatMap(commentsFromIssue),
    ...prs.flatMap(commentsFromPullRequest),
  ];
  const findings = toFindings(rawComments);
  const clusters = clusterFindings(findings);

  return {
    harvestedAt: new Date().toISOString(),
    sources: {
      issueCount: issues.length,
      prCount: prs.length,
      linkedPrCount: linked.size,
    },
    findings,
    clusters,
  };
}

/**
 * @param {ReturnType<typeof harvestReviewFindings>} harvest
 */
export function formatHarvestMarkdown(harvest) {
  const lines = [
    `# Review harvest`,
    "",
    `- harvestedAt: ${harvest.harvestedAt}`,
    `- issues: ${harvest.sources.issueCount}`,
    `- prs: ${harvest.sources.prCount}`,
    `- findings: ${harvest.findings.length}`,
    "",
  ];
  for (const [skill, items] of Object.entries(harvest.clusters)) {
    lines.push(`## ${skill} (${items.length})`, "");
    for (const item of items) {
      const loc = item.prUrl ?? item.issueUrl ?? "";
      const excerpt = (item.body ?? "").replace(/\s+/g, " ").slice(0, 180);
      lines.push(`- ${loc} — ${item.user}: ${excerpt}`);
    }
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

function main() {
  const opts = parseHarvestArgs(process.argv.slice(2));
  const harvest = harvestReviewFindings(opts);
  const json = `${JSON.stringify(harvest, null, 2)}\n`;
  if (opts.out) {
    fs.mkdirSync(path.dirname(path.resolve(opts.out)), { recursive: true });
    fs.writeFileSync(opts.out, json);
    const mdPath = opts.out.replace(/\.json$/i, ".md");
    fs.writeFileSync(mdPath, formatHarvestMarkdown(harvest));
    process.stderr.write(
      `wrote ${opts.out} (${harvest.findings.length} findings)\n`,
    );
  } else {
    process.stdout.write(json);
  }
}

const invokedDirectly =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("harvest.mjs");

if (invokedDirectly) {
  main();
}
