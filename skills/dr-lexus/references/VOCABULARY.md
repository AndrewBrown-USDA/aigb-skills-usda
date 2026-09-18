# Overused Claude Vocabulary Blacklist

Replace these terms with plain alternatives. This list changes as AI vocabulary patterns shift.

Claude models (Opus, Fable, Sonnet) use the same formal words and phrasing patterns. This isn't a quirk of one model -- it's baked into RLHF training across the family.

## High-Frequency Verbs

- **delve, dive, drill down** -> look at, check, study
- **showcase, demonstrate** -> show
- **underscore, highlight** -> point out
- **illuminate, elucidate, shed light on** -> explain
- **leverage, harness, utilize** -> use
- **facilitate, enable** -> help, make possible
- **foster** -> build, create
- **spearhead** -> lead, start, head
- **orchestrate** -> plan, run, manage
- **embark (on)** -> start
- **bolster** -> boost, strengthen, support
- **pave the way for** -> allow, lead to, set up
- **navigate** -> handle, work through
- **uncover, unlock, unveil** -> find, discover, release
- **champion** -> support, promote
- **resonate, reverberate** -> matter, stick
- **surface (verb)** -> appear, show, expose (keep only when precise: "surfaces the error")
- **unpack, dig into** -> examine, explain, work through (these are filler; just do the work)

## Abstract Nouns

- **tapestry, realm, landscape** -> field, area (or be specific)
- **interplay, nexus** -> link, connection (or rephrase without it)
- **testament, beacon, cornerstone** -> proof, example, key part
- **a myriad of, a plethora of** -> many, several
- **treasure trove** -> collection, store, source
- **labyrinth, crucible** -> maze, test, hard problem
- **journey, quest** -> avoid in technical writing
- **symphony** -> avoid; too poetic
- **enigma** -> mystery, puzzle
- **intricacies** -> details, complexity
- **gossamer** -> thin (usually just delete)
- **blast radius** -> scope, impact
- **smoking gun** -> proof, evidence
- **yak shaving** -> distraction, side task (or just name it)
- **footgun** -> risk, trap, gotcha
- **load-bearing** -> critical, core (outside architecture contexts)
- **belt-and-suspenders** -> redundant, backup

## Evaluative Adjectives

- **pivotal, multifaceted, intricate** -> important, complex
- **meticulous, robust** -> careful, strong
- **seamless, holistic** -> smooth, complete
- **vibrant, dynamic** -> cut it
- **paramount** -> main, key
- **profound** -> deep, major
- **transformative, groundbreaking** -> major, new
- **noteworthy, commendable** -> notable, good
- **compelling, insightful** -> interesting, useful
- **daunting** -> hard
- **enlightening, indelible** -> memorable, striking
- **cutting-edge** -> new, latest
- **essential** -> key (verify first)
- **nuanced** -> subtle, complex (often means "explain specifically")
- **whimsical** -> playful (rarely fits here)
- **unwavering** -> steady, firm
- **unique blend, diverse** -> mix, range (or be specific)
- **virtuoso, bustling, camaraderie** -> avoid; too narrative
- **comprehensive** -> complete (verify it actually is)
- **elegant** -> cut it or state concretely
- **gracefully** -> replace with the actual behavior
- **straightforward, simply, just** -> minimizers; they make readers feel stupid

## Intensifiers & Throat-Clearing

These add no information but create false emphasis. Shows up in every Claude model.

- **genuinely, actually** -> (cut it; if true/contradicting, just show it)
- **crucially** -> (cut it; if crucial, explain why)
- **the key [insight/is/thing]** -> (don't announce significance; just state it)
- **here's the thing** -> (throat-clearing; skip to the thing)
- **let me [action]** -> just do the action ("checking config" not "let me check config")
- **I hope this helps!** -> (social tic, zero information; delete)
- **in order to** -> (padding; "to" works alone)
- **let's dive in** -> (invitation/throat-clearing; start directly)

## Hedging Phrases & Preambles

- **it is important to note that** -> (cut it)
- **one could argue that** -> (cut it; just state it)
- **it's worth noting** -> (cut it)
- **serves as a testament to** -> (rephrase direct)
- **in the realm of** -> (cut; rephrase direct)
- **in light of** -> (cut; rephrase direct)
- **a delicate balance** -> (rephrase: trade-offs, tension)
- **undergoes transformation** -> (changes, shifts)
- **it is important to emphasize that** -> (cut it)
- **at the end of the day** -> (ultimately, in the end, or cut)
- **in the fast-paced world of** -> (in [industry], today, or cut)
- **bridging the gap between** -> (linking, connecting, joining)
- **additionally, furthermore, moreover** -> (and, also, or restructure)
- **nonetheless, that being said** -> (but, still, or cut)
- **in conclusion, in summary** -> (cut; let the summary speak)
- **important to understand** -> (cut it)
- **remember that** -> (cut it unless critical)
- **deep dive** -> examination, look, study
- **game changer** -> (just state the benefit plainly)
- **key insights** -> (insights, findings, or just say it)
- **little did [X] know** -> (avoid; too narrative)
- **at a high level** -> (delay tactic; just state the point)
- **relatively, fairly** -> (hedging adjectives; if true, it's strong)
- **interestingly** -> (false authority signal; cut it)
- **make sure to, be sure to** -> (instruction padding; just state it)
- **to be honest** -> (fake candor; if not honest before, don't fake it now)
- **given that, in terms of** -> (padding; tighten the clause)
- **this allows us to** -> (passive distance; "we can" or just do it)

## Technical Jargon (Valid but Overused by Claude)

These are legitimate technical terms, but Claude uses them performatively even in simple contexts. Use sparingly and only when precise:

- **idempotent** -> use "repeatable" or describe specifically
- **spine, seams, gate, substrate** -> (valid in architecture, but Claude uses as filler; be specific)
- **initialization** -> setup, start, begin
- **surface area** -> scope, scale, reach (in non-literal contexts)
- **circuit breaker** -> (valid pattern, but overused; be specific to the context)
- **fan out** -> spread, distribute, parallel processing (be concrete)
- **bespoke** -> custom, tailored, hand-built (and cut the pretension)

---

## Notes

- Not exhaustive. Use pattern recognition: if it sounds elevated or decorative, cut it.
- Customize for your domain. Academic, technical, and marketing contexts need different terms.
- AI vocabulary shifts often. Keep this list current.
- Tone is the real issue. Claude sounds like a Hacker News thread (especially Opus/Fable). This list cuts the posturing, not legitimate precision.
- RLHF rewards symmetry and closure (tricolons, hedging pairs, recap summaries) over commitment. Cut the shape, keep the claim.
