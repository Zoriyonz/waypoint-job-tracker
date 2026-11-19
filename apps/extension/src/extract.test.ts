// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { extractJob, MAX_CHARS } from "./extract";

const LONG = "Build and ship features with React and TypeScript. ".repeat(8);

function page(html: string) {
  document.documentElement.innerHTML = html;
  return extractJob(document);
}

const ld = (obj: unknown) =>
  `<head><script type="application/ld+json">${JSON.stringify(obj)}</script></head><body><h1>Ignored</h1></body>`;

beforeEach(() => {
  document.documentElement.innerHTML = "";
});

describe("structured data (schema.org JobPosting)", () => {
  it("reads title, company and a text-only description", () => {
    const job = page(
      ld({
        "@type": "JobPosting",
        title: "Frontend Engineer",
        hiringOrganization: { "@type": "Organization", name: "Northwind" },
        description: `<p>${LONG}</p><ul><li>React</li><li>TypeScript</li></ul>`,
      }),
    );
    expect(job).toMatchObject({
      title: "Frontend Engineer",
      company: "Northwind",
      source: "structured-data",
    });
    expect(job.text).toContain("React and TypeScript");
    expect(job.text).not.toMatch(/<\/?[a-z]/i);
  });

  it("finds a posting inside @graph and accepts an array @type", () => {
    const job = page(
      ld({
        "@graph": [
          { "@type": "WebSite" },
          {
            "@type": ["Thing", "JobPosting"],
            title: "Dev",
            hiringOrganization: "Acme",
            description: LONG,
          },
        ],
      }),
    );
    expect(job).toMatchObject({ title: "Dev", company: "Acme", source: "structured-data" });
  });

  it("keeps line breaks from block elements", () => {
    const job = page(
      ld({
        "@type": "JobPosting",
        title: "T",
        description: `Requirements<br>React<br>TypeScript<p>${LONG}</p>`,
      }),
    );
    expect(job.text.split("\n").slice(0, 3)).toEqual(["Requirements", "React", "TypeScript"]);
  });

  it("is inert: markup in a description never becomes live DOM or runs handlers", () => {
    (window as unknown as { pwned?: boolean }).pwned = false;
    const job = page(
      ld({
        "@type": "JobPosting",
        title: "T",
        description: `<img src=x onerror="window.pwned=true"><script>window.pwned=true</script>${LONG}`,
      }),
    );
    expect((window as unknown as { pwned: boolean }).pwned).toBe(false);
    expect(document.querySelector("img")).toBeNull();
    expect(job.text).not.toContain("onerror");
  });

  it("ignores malformed JSON-LD and falls back", () => {
    const job = page(
      `<head><script type="application/ld+json">{ not json</script></head>
       <body><div id="jobDescriptionText">${LONG}</div></body>`,
    );
    expect(job.source).toBe("known-selector");
  });

  it("falls back when the structured description is too short to be useful", () => {
    const job = page(
      `<head><script type="application/ld+json">${JSON.stringify({ "@type": "JobPosting", title: "Dev", description: "Short." })}</script></head>
       <body><main>${LONG}</main></body>`,
    );
    expect(job.source).toBe("known-selector");
    expect(job.title).toBe("Dev");
  });
});

describe("known selectors", () => {
  it("prefers a specific ATS container over generic main", () => {
    const job = page(
      `<body><h1>Backend Dev</h1><main>${"Footer links and menus. ".repeat(20)}
         <div class="show-more-less-html__markup">${LONG}</div></main></body>`,
    );
    expect(job.source).toBe("known-selector");
    expect(job.title).toBe("Backend Dev");
    expect(job.text).toContain("React and TypeScript");
    expect(job.text).not.toContain("Footer links");
  });

  it("reads company from og:site_name when there is no structured data", () => {
    const job = page(
      `<head><meta property="og:site_name" content="Cedar AI"></head><body><article>${LONG}</article></body>`,
    );
    expect(job.company).toBe("Cedar AI");
  });
});

describe("page-text fallback", () => {
  it("uses the whole page when nothing else matches and caps its length", () => {
    const job = page(`<body><div>${"word ".repeat(10_000)}</div></body>`);
    expect(job.source).toBe("page-text");
    expect(job.text.length).toBeLessThanOrEqual(MAX_CHARS);
  });

  it("falls back to document.title when there is no h1", () => {
    document.title = "Careers | Acme";
    expect(extractJob(document).title).toBe("Careers | Acme");
  });
});
