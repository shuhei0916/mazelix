# 英和辞書のデータ public/dictionary/ejdict.txt を作る。
# 使い方: git clone https://github.com/kujirahand/EJDict && python scripts/build-dictionary.py EJDict
import sys
from pathlib import Path

HEADER = """\
# English-Japanese dictionary: "<headword>[,<headword>...]<TAB><meaning> / <meaning> ..."
# EJDict-hand by kujirahand <https://github.com/kujirahand/EJDict>, public domain (CC0 1.0).
"""

source = Path(sys.argv[1]) / "src"
lines = []
for path in sorted(source.glob("*.txt")):
    for line in path.read_text(encoding="utf-8").splitlines():
        if "\t" in line and not line.startswith("#"):
            lines.append(line)

out = Path(__file__).parent.parent / "public" / "dictionary" / "ejdict.txt"
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(HEADER + "\n".join(lines) + "\n", encoding="utf-8", newline="\n")
print(f"{len(lines)} entries -> {out}")
