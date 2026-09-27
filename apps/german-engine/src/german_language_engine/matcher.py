from __future__ import annotations
from dataclasses import dataclass
from .models import BoundSlot, ExpressionMatch, ExpressionPattern, Slot, SlotType, Token

REFLEXIVES = {"mich","mir","dich","dir","sich","uns","euch"}
PRONOMINAL_ADVERBS = {
    "darauf":"auf","worauf":"auf","davon":"von","wovon":"von","damit":"mit","womit":"mit",
    "daran":"an","woran":"an","darüber":"über","worüber":"über","dafür":"für","wofür":"für",
    "dazu":"zu","wozu":"zu","dabei":"bei","wobei":"bei","dagegen":"gegen","wogegen":"gegen",
    "davor":"vor","wovor":"vor","dahinter":"hinter","darunter":"unter","darum":"um","worum":"um",
}
ARTICLES = {"der","die","das","den","dem","des","ein","eine","einen","einem","einer","eines"}
NEGATION_LEMMAS = {"nicht", "kein"}

@dataclass
class SlotHit:
    slot: Slot
    indices: list[int]
    evidence: str

def _case(token: Token) -> set[str]:
    return set(token.morph.get("Case", []))

def _descendants(tokens: list[Token], root: int, max_depth: int = 4) -> set[int]:
    found={root}; frontier={root}
    for _ in range(max_depth):
        nxt={t.i for t in tokens if t.head in frontier and t.i not in found}
        if not nxt: break
        found |= nxt; frontier=nxt
    return found

class StructuralMatcher:
    """Lemma/morphology/dependency-aware matcher.

    It intentionally tolerates parser variation: dependency locality increases confidence,
    while a bounded clause-level fallback prevents German scrambling/passive/modal forms
    from becoming false negatives.
    """
    def match(self, tokens: list[Token], pattern: ExpressionPattern) -> list[ExpressionMatch]:
        heads=[t for t in tokens if t.lemma.lower()==pattern.head_lemma.lower()]
        matches=[]
        for head in heads:
            hits=[]; used={head.i}; failed=False
            domain=_descendants(tokens, head.i) | {t.i for t in tokens if t.head==head.head}
            for slot in pattern.slots:
                hit=self._slot(tokens, head, slot, used, domain)
                if hit is None:
                    if slot.optional: continue
                    failed=True; break
                hits.append(hit); used.update(hit.indices)
            if failed: continue
            indices=sorted(used)
            surface=" ".join(tokens[i].text for i in indices)
            locality=sum(1 for h in hits if "dependency" in h.evidence)
            confidence=min(.99, .72 + .04*len(hits) + .03*locality)
            negation_indices=self._negation_indices(tokens, head, indices, domain)
            bound_slots=[BoundSlot(slot_id=h.slot.id,token_indices=h.indices,surface=" ".join(tokens[i].text for i in h.indices),case=h.slot.case) for h in hits]
            matches.append(ExpressionMatch(
                pattern_id=pattern.id, canonical=pattern.canonical, type=pattern.type,
                meaning_tr=pattern.meaning_tr, token_indices=indices, surface=surface,
                confidence=confidence, evidence=[h.evidence for h in hits],
                negated=bool(negation_indices), negation_token_indices=negation_indices,
                bound_slots=bound_slots,
            ))
        return matches

    def _negation_indices(self, tokens:list[Token], head:Token, matched:list[int], domain:set[int]) -> list[int]:
        matched_set=set(matched)
        negated=[]
        for token in tokens:
            if token.lemma.lower() not in NEGATION_LEMMAS:
                continue
            if token.head==head.i or token.i in domain:
                negated.append(token.i)
                continue
            if token.head in matched_set:
                negated.append(token.i)
        return sorted(set(negated))

    def _slot(self, tokens:list[Token], head:Token, slot:Slot, used:set[int], domain:set[int]) -> SlotHit|None:
        pool=[t for t in tokens if t.i not in used]
        local=[t for t in pool if t.i in domain or t.head==head.i or head.head==t.i]
        ordered=local + [t for t in pool if t not in local]

        if slot.type == SlotType.REFLEXIVE:
            for t in ordered:
                if t.text.lower() in REFLEXIVES or "Yes" in t.morph.get("Reflex",[]):
                    return SlotHit(slot,[t.i],"reflexive dependency" if t in local else "reflexive clause fallback")

        if slot.type in {SlotType.LEMMA, SlotType.PARTICLE}:
            wanted={x.lower() for x in [slot.lemma,*slot.alternatives] if x}
            for t in ordered:
                if t.lemma.lower() in wanted or t.text.lower() in wanted:
                    return SlotHit(slot,[t.i],"lemma dependency" if t in local else "lemma clause fallback")

        if slot.type == SlotType.PREPOSITION:
            prep=(slot.prep or slot.lemma or "").lower()
            for t in ordered:
                low=t.text.lower()
                if low in PRONOMINAL_ADVERBS and PRONOMINAL_ADVERBS[low]==prep:
                    return SlotHit(slot,[t.i],f"pronominal-adverb:{low}->{prep}")
                if t.lemma.lower()==prep or low==prep:
                    # Include governed nominal when parser exposes it.
                    children=[x for x in tokens if x.head==t.i and (not slot.case or _case(x)&set(slot.case))]
                    ids=[t.i]+[x.i for x in children[:1]]
                    return SlotHit(slot,ids,"preposition dependency" if t in local else "preposition clause fallback")

        if slot.type == SlotType.PRONOMINAL_ADVERB:
            prep=(slot.prep or "").lower()
            for t in ordered:
                if PRONOMINAL_ADVERBS.get(t.text.lower())==prep:
                    return SlotHit(slot,[t.i],"pronominal-adverb normalization")

        if slot.type == SlotType.OBJECT:
            for t in ordered:
                if t.pos in {"NOUN","PROPN","PRON"} and (not slot.case or _case(t)&set(slot.case)):
                    return SlotHit(slot,[t.i],"object dependency" if t in local else "object clause fallback")

        if slot.type == SlotType.CLAUSE:
            for t in ordered:
                if t.dep in {"ccomp","xcomp","oc","cp"} or t.text.lower() in {"dass","ob"}:
                    return SlotHit(slot,[t.i],"clausal complement")
        return None
