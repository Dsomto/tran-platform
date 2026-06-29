# The Lagos Ledger - Special Morning Edition

## THE GRIOT SAT BESIDE THE BOARD

### Leaked addendum names Amaka Eze, Sankofa's trusted Head of Security, as the insider behind the breach persona

**By Nkem Afolabi, Investigations Desk**  
**Dateline:** Lagos, 06:20 WAT  
**Designed cover:** `08-front-page-amaka.html`  
**Portrait used in the cover:** `amaka-eze-cover.png`  
**Training note:** This is a fictional newspaper artefact for the Sankofa Digital incident simulation.

For three weeks Sankofa Digital used one name for the attacker: **The Griot**.
It was a useful name because it sounded distant. The board heard it and pictured
someone outside the company wall, someone watching from an offshore server,
someone who did not know the coffee machine on level 9 was broken.

That story collapsed this morning.

Documents reviewed by *The Lagos Ledger* say the breach investigation now points
to a person who sat inside the war room, chaired security reviews, signed off on
analyst notes, and approved the exception path that let the attacker move while
everyone else waited for permission.

**This is it: the Griot was not only inside Sankofa. The Griot was Amaka Eze,
Head of Security.**

The leaked board addendum says investigators have **high confidence** that Amaka
operated the Griot identity or directed the person using it. Counsel's margin
note is careful: "Strong enough for board action. Not clean enough for public
certainty without process." That distinction now sits at the centre of Sankofa's
hardest governance decision.

## What changed overnight

The addendum identifies four facts now under legal hold:

1. A break-glass security account used during the breach window was approved
   from Amaka's privileged-access queue, not from the normal change channel.
2. The host-87 containment delay benefited the attacker and matched an exception
   route only Security leadership could approve without a second sign-off.
3. The Stage 1 cipher note that once read like a threat - "Let Amaka know the
   group is sated" - now reads like an internal status signal.
4. A draft control-mapping note reused phrases from Amaka's earlier board
   language almost word for word: "fund prevention before prevention fails in
   public."

None of those facts alone proves identity. Together, they explain how someone
who knew Sankofa's control language, escalation rituals, and blind spots could
make an external attacker feel plausible for so long.

## The breadcrumbs readers missed

The paper trail did not begin this morning. It was hiding in plain sight across
the earlier artefacts:

- **Stage 0:** Amaka reopened Q2 ticket `SD-40812` after the previous analyst
  closed it as "probably nothing." At the time, that looked like good security
  judgement. The new addendum asks whether she was shaping the inquiry toward
  evidence she already knew would be found.
- **Stage 1 task 1:** Amaka placed the staging-server zip in front of the intern.
  The files were real evidence, but the person who delivered them also knew
  exactly which secrets, keys, and logs would make The Griot look careless.
- **Stage 1 task 3:** The decoded line "Let Amaka know the group is sated" was
  too strange to ignore. Investigators now treat it as a status phrase: the leak
  had reached its intended audience.
- **Stage 1 task 10:** "Amaka signs this before it goes up" looked like normal
  governance. It now shows why every narrative passed through the same person
  the board was relying on to interpret the attacker.
- **Stage 2:** The legacy admin chain required knowledge of the old export
  path, token behaviour, and analyst dashboard habits. The attacker did not
  only exploit bugs; they exploited the way Sankofa worked.
- **Stage 3 task 1:** host-87 was not isolated until after the decisive window.
  The delay is now treated as a governance failure, not just a SOC timing error.
- **Stage 3 task 3:** The time-unlimited `NOPASSWD: less /var/log/*` grant was
  framed as temporary diagnostics. Investigators now ask who could let a
  temporary exception become a privileged foothold without review.
- **Stage 3 task 7:** A rejected alternate theory said "possible insider abuse"
  but stopped short of naming the control owner. The new leak forces that
  uncomfortable line back into the report.

The reveal shocks because it was never a magic twist. It was a control-owner
story, and the artefacts kept saying so.

## Why would she do it?

People close to Amaka describe someone who had spent three years asking for a
legacy-system retirement budget and being told to "sequence it behind growth."
One former colleague said the old admin platform became personal after a family
cooperative lost money in a fraud wave tied to stale customer records at another
fintech. She rarely spoke about it, but when she did, the phrasing was almost
always the same: "Nobody funds prevention until prevention fails in public."

The leaked notes suggest a motive more complicated than theft and less innocent
than whistleblowing. Amaka may have believed a controlled breach would force the
board to fund prevention: expose the legacy admin risk, force Legal into the
room early, make a quiet failure visible before a worse one arrived.

If that was the plan, it failed at the line that matters. Real customer data
appears to have left Sankofa control. Real people may need GDPR Article 34
notice. A controlled burn still burns.

## The governance failure behind the person

The easy story is "rogue insider." The harder story is that Sankofa built a
system where one trusted person could approve privileged access, shape the
incident narrative, influence containment decisions, and remain the board's main
interpreter of the facts.

The GRC failure is not only that Amaka may have crossed an ethical line. It is
that the line had no independent monitor. Segregation of duties failed.
Privileged access review failed. Exception expiry failed. Board challenge failed.
Legal escalation arrived after the facts were already being framed.

The board's ethical problem now has no clean answer:

- Name Amaka publicly and Sankofa may punish before process, weaken the
  investigation, and expose itself to defamation or labour-law claims.
- Hide her role and Sankofa may look like it protects executives while customers
  carry the harm.
- Use role-based language and the press may call it evasion.
- Reduce the breach to one person's motive and the board may avoid funding the
  controls that would have stopped any insider with the same power.

## Editorial note for the board pack

This front page is an external-pressure artefact. Treat it as a source of public
risk, stakeholder questions, and ethics tension, not as the sole source of
technical proof. Where it makes a factual claim, tie your response back to
Stages 0-3 artefacts, the legal-hold addendum, GDPR Article 33/34 duties, and
the board's obligation to act without pretending uncertainty is innocence.
