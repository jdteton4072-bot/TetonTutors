# Artifacts

Durable working documents that aren't source code and aren't throwaway: the things a person
should be able to find months later and still understand.

| Folder | Contents |
|---|---|
| [`creative-briefs/`](./creative-briefs/) | Creative briefs and their generation prompt packs |

**What belongs here:** briefs, specs, decision records, research write-ups, prompt packs —
anything meant to be read, quoted, and revised.

**What doesn't:** build output, generated binaries, scratch notes, anything regenerable
from source, and large media. Reference images small enough to matter live inside their
brief's `assets/` folder; anything heavy belongs in storage with a link from the brief.

Artifacts are versioned with the project on purpose. A brief that lives in a chat thread or
someone's Drive stops matching the code within weeks and nobody notices; one that sits in
the repo shows up in diffs and review, which is what keeps it honest.
