from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "import_external_lexicons.py"
SPEC = importlib.util.spec_from_file_location("import_external_lexicons", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


def test_parseme_extracts_vmwe_and_maps_category(tmp_path: Path):
    cupt = tmp_path / "train.cupt"
    cupt.write_text(
        "# sent_id = de-1\n"
        "1\tEr\ter\tPRON\t_\tCase=Nom\t3\tnsubj\t_\t_\t*\n"
        "2\tsich\tsich\tPRON\t_\tCase=Acc\t3\texpl:pv\t_\t_\t1:IRV\n"
        "3\tfreut\tfreuen\tVERB\t_\tMood=Ind\t0\troot\t_\t_\t1\n"
        "4\tdarauf\tdarauf\tADV\t_\t_\t3\tadvmod\t_\t_\t*\n\n"
        "# sent_id = de-2\n"
        "1\tSie\tsie\tPRON\t_\tCase=Nom\t3\tnsubj\t_\t_\t*\n"
        "2\tsich\tsich\tPRON\t_\tCase=Acc\t3\texpl:pv\t_\t_\t1:IRV\n"
        "3\tfreuen\tfreuen\tVERB\t_\t_\t0\troot\t_\t_\t1\n\n",
        encoding="utf-8",
    )

    items = MODULE.parse_parseme_files([cupt], min_count=2)

    assert len(items) == 1
    item = items[0]
    assert item.type == "REFLEXIVE_VERB"
    assert item.head_lemma == "freuen"
    assert item.evidence_count == 2
    assert any(slot["type"] == "REFLEXIVE" for slot in item.slots)


def test_verbframes_imports_only_fixed_lexical_frames(tmp_path: Path):
    source = tmp_path / "verbframes.json"
    source.write_text(
        json.dumps(
            [
                {"vfin": "bezahlen", "optional": ["NN", "AN"]},
                {"vfin": "machen", "AN": "Gebrauch", "von+D": "Möglichkeit", "optional": ["NN"]},
                {"vfin": "abfragen", "AN": "Auskunft", "optional": ["NN", "von+D/bei+D"]},
            ],
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    items = MODULE.parse_verbframes(source)

    assert len(items) == 2
    machen = next(item for item in items if item.head_lemma == "machen")
    assert machen.type == "VERB_PREPOSITION"
    assert any(slot.get("prep") == "von" for slot in machen.slots)
    assert any(slot.get("lemma") == "Gebrauch" for slot in machen.slots)


def test_deduplicate_combines_evidence():
    first = MODULE.Candidate(
        id="a",
        canonical="eine Entscheidung treffen",
        type="FUNCTION_VERB",
        head_lemma="treffen",
        slots=[{"id": "x", "type": "LEMMA", "lemma": "Entscheidung"}],
        source=["parseme"],
        source_category=["LVC.full"],
        evidence_count=3,
    )
    second = MODULE.Candidate(
        id="b",
        canonical="Entscheidung treffen",
        type="FUNCTION_VERB",
        head_lemma="treffen",
        slots=[{"id": "y", "type": "LEMMA", "lemma": "Entscheidung"}],
        source=["verbframes"],
        source_category=["VerbframesDE"],
        evidence_count=1,
    )

    result = MODULE.deduplicate([first, second])

    assert len(result) == 1
    assert result[0].evidence_count == 4
    assert set(result[0].source) == {"parseme", "verbframes"}


def test_parseme_normalizes_reflexive_canonical_form(tmp_path: Path):
    cupt = tmp_path / "irv.cupt"
    cupt.write_text(
        "1\tEr\ter\tPRON\t_\tCase=Nom\t3\tnsubj\t_\t_\t*\n"
        "2\tsich\ter|es|sie\tPRON\t_\tCase=Acc\t3\texpl:pv\t_\t_\t1:IRV\n"
        "3\tbefindet\tbefinden\tVERB\t_\tMood=Ind\t0\troot\t_\t_\t1\n\n"
        "1\tSie\tsie\tPRON\t_\tCase=Nom\t3\tnsubj\t_\t_\t*\n"
        "2\tsich\ter|es|sie\tPRON\t_\tCase=Acc\t3\texpl:pv\t_\t_\t1:IRV\n"
        "3\tbefinden\tbefinden\tVERB\t_\t_\t0\troot\t_\t_\t1\n\n",
        encoding="utf-8",
    )

    items = MODULE.parse_parseme_files([cupt], min_count=2)

    assert len(items) == 1
    assert items[0].canonical == "sich befinden"


def test_parseme_normalizes_particle_verb_to_dictionary_form(tmp_path: Path):
    cupt = tmp_path / "vpc.cupt"
    cupt.write_text(
        "1\tDie\tdie\tDET\t_\t_\t2\tdet\t_\t_\t*\n"
        "2\tSitzung\tSitzung\tNOUN\t_\t_\t3\tnsubj\t_\t_\t*\n"
        "3\tfindet\tfinden\tVERB\t_\t_\t0\troot\t_\t_\t1:VPC.full\n"
        "4\tstatt\tstatt\tADV\t_\t_\t3\tcompound:prt\t_\t_\t1\n\n"
        "1\tEs\tes\tPRON\t_\t_\t2\tnsubj\t_\t_\t*\n"
        "2\tfindet\tfinden\tVERB\t_\t_\t0\troot\t_\t_\t1:VPC.full\n"
        "3\tstatt\tstatt\tADV\t_\t_\t2\tcompound:prt\t_\t_\t1\n\n",
        encoding="utf-8",
    )

    items = MODULE.parse_parseme_files([cupt], min_count=2)

    assert len(items) == 1
    assert items[0].canonical == "stattfinden"


def test_parseme_vid_known_constructions_get_learner_facing_forms(tmp_path: Path):
    cupt = tmp_path / "vid.cupt"
    cupt.write_text(
        "1\tEs\tes\tPRON\t_\t_\t2\tnsubj\t_\t_\t1:VID\n"
        "2\tgibt\tgeben\tVERB\t_\t_\t0\troot\t_\t_\t1\n\n"
        "1\tEs\tes\tPRON\t_\t_\t2\tnsubj\t_\t_\t1:VID\n"
        "2\tgibt\tgeben\tVERB\t_\t_\t0\troot\t_\t_\t1\n\n",
        encoding="utf-8",
    )

    items = MODULE.parse_parseme_files([cupt], min_count=2)

    assert len(items) == 1
    assert items[0].canonical == "es gibt"
    assert items[0].type == "FIXED_CONSTRUCTION"


def test_parseme_vid_fixed_particle_expression_is_normalized(tmp_path: Path):
    cupt = tmp_path / "vid2.cupt"
    cupt.write_text(
        "1\tDavon\tdavon\tADV\t_\t_\t2\tadvmod\t_\t_\t1:VID\n"
        "2\tgeht\tgehen\tVERB\t_\t_\t0\troot\t_\t_\t1\n"
        "3\taus\taus\tPART\t_\t_\t2\tcompound:prt\t_\t_\t1\n\n"
        "1\tDavon\tdavon\tADV\t_\t_\t2\tadvmod\t_\t_\t1:VID\n"
        "2\tgehen\tgehen\tVERB\t_\t_\t0\troot\t_\t_\t1\n"
        "3\taus\taus\tPART\t_\t_\t2\tcompound:prt\t_\t_\t1\n\n",
        encoding="utf-8",
    )

    items = MODULE.parse_parseme_files([cupt], min_count=2)

    assert len(items) == 1
    assert items[0].canonical == "davon ausgehen"
    assert items[0].type == "FIXED_CONSTRUCTION"


def test_parseme_vid_context_verified_constructions(tmp_path: Path):
    cupt = tmp_path / "vid3.cupt"
    cupt.write_text(
        "1\tEs\tes\tPRON\t_\t_\t2\tnsubj\t_\t_\t1:VID\n"
        "2\tkam\tkommen\tVERB\t_\t_\t0\troot\t_\t_\t1\n\n"
        "1\tEs\tes\tPRON\t_\t_\t2\tnsubj\t_\t_\t1:VID\n"
        "2\tkommt\tkommen\tVERB\t_\t_\t0\troot\t_\t_\t1\n\n",
        encoding="utf-8",
    )
    items = MODULE.parse_parseme_files([cupt], min_count=2)
    assert len(items) == 1
    assert items[0].canonical == "es kommt zu etwas"
    assert items[0].type == "FIXED_CONSTRUCTION"


def test_parseme_vpc_known_prefix_fallback(tmp_path: Path):
    cupt = tmp_path / "vpc2.cupt"
    cupt.write_text(
        "1\träumt\träumen\tVERB\t_\t_\t0\troot\t_\t_\t1:VPC.full\n"
        "2\tein\tein\tX\t_\t_\t1\tdep\t_\t_\t1\n\n"
        "1\träumt\träumen\tVERB\t_\t_\t0\troot\t_\t_\t1:VPC.full\n"
        "2\tein\tein\tX\t_\t_\t1\tdep\t_\t_\t1\n\n",
        encoding="utf-8",
    )
    items = MODULE.parse_parseme_files([cupt], min_count=2)
    assert len(items) == 1
    assert items[0].canonical == "einräumen"


def test_parseme_vid_rule_keys_are_casefolded_for_german_sharp_s(tmp_path: Path):
    cupt = tmp_path / "vid_casefold.cupt"
    cupt.write_text(
        "1\theißt\theißen\tVERB\t_\t_\t0\troot\t_\t_\t1:VID\n"
        "2\tes\tes\tPRON\t_\t_\t1\texpl\t_\t_\t1\n\n"
        "1\theißt\theißen\tVERB\t_\t_\t0\troot\t_\t_\t1:VID\n"
        "2\tes\tes\tPRON\t_\t_\t1\texpl\t_\t_\t1\n\n",
        encoding="utf-8",
    )

    items = MODULE.parse_parseme_files([cupt], min_count=2)

    assert len(items) == 1
    assert items[0].canonical == "es heißt"
    assert items[0].type == "FIXED_CONSTRUCTION"


def test_parseme_vid_demonstrative_das_heisst_normalization(tmp_path: Path):
    cupt = tmp_path / "vid_das_heisst.cupt"
    cupt.write_text(
        "1\theißt\theißen\tVERB\t_\t_\t0\troot\t_\t_\t1:VID\n"
        "2\tdas\tder\tPRON\t_\t_\t1\tobj\t_\t_\t1\n\n"
        "1\theißt\theißen\tVERB\t_\t_\t0\troot\t_\t_\t1:VID\n"
        "2\tdas\tder\tPRON\t_\t_\t1\tobj\t_\t_\t1\n\n",
        encoding="utf-8",
    )

    items = MODULE.parse_parseme_files([cupt], min_count=2)

    assert len(items) == 1
    assert items[0].canonical == "das heißt"
    assert items[0].type == "FIXED_CONSTRUCTION"


def test_parseme_vid_bereitstehen_normalization(tmp_path: Path):
    cupt = tmp_path / "vid_bereitstehen.cupt"
    cupt.write_text(
        "1\tsteht\tstehen\tVERB\t_\t_\t0\troot\t_\t_\t1:VID\n"
        "2\tbereit\tbereit\tADV\t_\t_\t1\tadvmod\t_\t_\t1\n\n"
        "1\tstehen\tstehen\tVERB\t_\t_\t0\troot\t_\t_\t1:VID\n"
        "2\tbereit\tbereit\tADV\t_\t_\t1\tadvmod\t_\t_\t1\n\n",
        encoding="utf-8",
    )

    items = MODULE.parse_parseme_files([cupt], min_count=2)

    assert len(items) == 1
    assert items[0].canonical == "bereitstehen"
    assert items[0].type == "PARTICLE_VERB"


def test_parseme_vpc_slots_are_particles_not_prepositions(tmp_path: Path):
    cupt = tmp_path / "vpc_particle.cupt"
    cupt.write_text(
        "1\tfindet\tfinden\tVERB\t_\t_\t0\troot\t_\t_\t1:VPC.full\n"
        "2\tstatt\tstatt\tADP\t_\tCase=Acc\t1\tcompound:prt\t_\t_\t1\n\n"
        "1\tfindet\tfinden\tVERB\t_\t_\t0\troot\t_\t_\t1:VPC.full\n"
        "2\tstatt\tstatt\tADP\t_\tCase=Acc\t1\tcompound:prt\t_\t_\t1\n\n",
        encoding="utf-8",
    )

    items = MODULE.parse_parseme_files([cupt], min_count=2)

    assert len(items) == 1
    assert items[0].canonical == "stattfinden"
    assert items[0].slots == [
        {"id": "particle_1", "type": "PARTICLE", "lemma": "statt"}
    ]


def test_parseme_vpc_semi_slots_are_particles(tmp_path: Path):
    cupt = tmp_path / "vpc_semi_particle.cupt"
    cupt.write_text(
        "1\tbietet\tbieten\tVERB\t_\t_\t0\troot\t_\t_\t1:VPC.semi\n"
        "2\tan\tan\tADP\t_\tCase=Acc\t1\tcompound:prt\t_\t_\t1\n\n"
        "1\tbietet\tbieten\tVERB\t_\t_\t0\troot\t_\t_\t1:VPC.semi\n"
        "2\tan\tan\tADP\t_\tCase=Acc\t1\tcompound:prt\t_\t_\t1\n\n",
        encoding="utf-8",
    )

    items = MODULE.parse_parseme_files([cupt], min_count=2)

    assert len(items) == 1
    assert items[0].canonical == "anbieten"
    assert items[0].slots == [
        {"id": "particle_1", "type": "PARTICLE", "lemma": "an"}
    ]


def test_parseme_vid_particle_override_emits_particle_slot(tmp_path: Path):
    cupt = tmp_path / "vid_particle.cupt"
    cupt.write_text(
        "1\tsteht\tstehen\tVERB\t_\t_\t0\troot\t_\t_\t1:VID\n"
        "2\tfest\tfest\tADV\t_\t_\t1\tadvmod\t_\t_\t1\n\n"
        "1\tsteht\tstehen\tVERB\t_\t_\t0\troot\t_\t_\t1:VID\n"
        "2\tfest\tfest\tADV\t_\t_\t1\tadvmod\t_\t_\t1\n\n",
        encoding="utf-8",
    )

    items = MODULE.parse_parseme_files([cupt], min_count=2)

    assert len(items) == 1
    assert items[0].canonical == "feststehen"
    assert items[0].type == "PARTICLE_VERB"
    assert items[0].slots == [
        {"id": "particle_1", "type": "PARTICLE", "lemma": "fest"}
    ]
