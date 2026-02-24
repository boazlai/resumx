# One Column vs. Two Columns

Two-column resumes look sleek. The data says they cost you interviews.

## How recruiters actually read resumes

The [TheLadders eye-tracking study](https://www.theladders.com/career-advice/why-do-recruiters-spend-only-7-4-seconds-on-resumes) (2012, updated 2018) tracked 30 professional recruiters over 10 weeks using eye-tracking hardware. Their key findings on layout:

- Recruiters spend an average of **7.4 seconds** on an initial scan before making a fit/no-fit decision
- Eyes follow an **F-pattern**: starting top-left, scanning right, then moving down the left margin and scanning right again
- Two-column layouts were identified as a **negative design element**, perceived as "cluttered," which disrupted the natural scanning flow
- To cope with the clutter, recruiters concentrated on **fewer areas** of the page, meaning they read _less_ of your content than they would on a single-column resume

Single-column layouts naturally align with the F-pattern. Two columns force the eye to choose which column to follow, breaking the scan.

### Caveats on the eye-tracking research

This study is the most widely cited source on recruiter reading behavior, but it has real limits:

- **30 recruiters** is a tiny sample. There were roughly 39,000 staffing agencies in the U.S. at the time.
- The methodology was never peer-reviewed. How recruiters were timed, which eye-tracking hardware was used, and how many resumes were reviewed per session are not disclosed.
- TheLadders is a job board, not a research institution. The "7.4 seconds" figure has functioned as marketing content.
- The study doesn't separate the column layout variable from other design variables (font choices, density, whitespace). The "clutter" finding may reflect the specific templates tested, not two-column layouts in general.

Despite these limits, the F-pattern finding is consistent with decades of broader UX eye-tracking research on how humans scan documents and web pages.

## How ATS systems parse columns

The perception that "modern ATS can read anything" is wrong. While top-tier systems like Greenhouse and Lever are improving, the majority of the ATS market still uses simple linear text extraction.

### The parsing mechanism

Most ATS parsers read documents **strictly left-to-right, top-to-bottom**. When they encounter a two-column layout, they don't process column A then column B. They read line 1 of the left column, immediately followed by line 1 of the right column, mashing unrelated content together.

If your left column has "Skills" and your right column has "Experience," the ATS output might look like:

```
Python  Senior Software Engineer
React   Acme Corp, 2021-2024
SQL     Led migration of payment service...
```

This creates unreadable gibberish in the recruiter's backend dashboard. Your resume isn't "rejected," it becomes **invisible** in keyword searches because the parsed fields are garbled.

### The Enhancv ATS parsing study (2023)

[Enhancv](https://enhancv.com/blog/busting-ats-myths/) tested dozens of resume templates from Microsoft Office, Canva, Google Docs, and their own builder against Indeed's ATS, scoring how accurately each section was parsed.

**Overall averages:**

| Layout        | Average parse score |
| ------------- | ------------------- |
| Single-column | 93%                 |
| Double-column | 86%                 |

**Where two-column resumes lost the most:**

| Section                 | Single-column | Double-column |
| ----------------------- | ------------- | ------------- |
| Skills                  | 65%           | 46%           |
| Education               | ~100%         | 88%           |
| Certifications          | ~100%         | 86%           |
| LinkedIn / social links | 100%          | 82%           |

Skills parsing dropped by almost 20 percentage points, which is the section recruiters filter on most.

**The "well-built tools" exception**

Enhancv also ran a filtered analysis looking only at Google Docs and their own product (excluding Canva and MS Office). In this subset, double-column templates actually scored **higher** (98%) than single-column (95%). This suggests that how the columns are built (semantic structure vs. text boxes) matters more than the column count itself.

**Caveats on the Enhancv study**

Before trusting the 98% double-column score, consider the limits of the research:

- **Small sample:** The 98% figure comes from a filtered subset, and the original article admits it only applies "in some cases."
- **Single ATS:** Tested only against Indeed. Results will differ on stricter systems like Workday or Taleo.
- **The aggregate truth:** When all tools were included, **single-column parsed better across every section except location headers**.
- **Technical opacity:** The study doesn't disclose the specific templates tested, making it hard to independently verify what makes a template "well-built."

### How specific ATS platforms handle columns

Different systems fail in different ways. [Jobscan submitted a two-column resume to Lever](https://www.jobscan.co/blog/resume-tables-columns-ats/) and published the parsed output as proof: the ATS successfully extracted the work experience, but **ignored the second column entirely**. The applicant's skills, summary, and contact info vanished.

While no system handles columns perfectly, behavior varies by vendor:

- **Taleo (Oracle):** Reads strictly left-to-right. Two columns cause the parser to jump randomly between sections, scrambling content ([Hireflow](https://hireflow.net/blog/taleo-resume-parsing-problems-explained)).
- **iCIMS:** Often skips content placed inside tables or columns entirely ([Princive](https://www.princive.com/ats/systems/icims)).
- **Workday:** Highly strict. Two columns will fail unless created with native Microsoft Word column formatting (never text boxes) ([Princive](https://www.princive.com/ats/systems/workday)).
- **Greenhouse / Lever:** More tolerant than legacy systems, but still unreliable with complex layouts ([AI ResumeGuru](https://airesume.guru/blog/single-column-vs-two-column-resume-which-layout-gets-more-interviews/)).

### Canva and design tool exports

Resumes exported from design tools like Canva or Figma deserve special mention. These tools generate PDFs using absolute positioning, placing each text block at exact coordinates on the page. There is no semantic reading order for a parser to follow. Industry estimates put the parsing success rate for design-tool exports at **under 5%** for older ATS systems. Even on modern systems, the results are unreliable.

## Recommendation

**When submitting applications through online portals, we recommend using a single-column layout**. The reasoning is straightforward: a single-column design minimizes the risk of parsing errors, ensuring your information is accurately read by nearly all Applicant Tracking Systems.

However, **two-column layouts still have their place. They are excellent for direct communication, such as emailing a hiring manager, handing out printed copies at networking events, or sharing on your personal website.** In these scenarios, the visual appeal and efficient use of space that a two-column design provides can be highly effective.
