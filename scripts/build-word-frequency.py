# 英単語の頻度（Zipf）のデータ src/data/en-word-frequency.txt を作る。
# 使い方: pip install wordfreq && python scripts/build-word-frequency.py
import re
from collections import defaultdict
from pathlib import Path

from wordfreq import top_n_list, zipf_frequency

# これより珍しい単語は同梱せず、「知らない単語」として扱う（約 29,000 語、約 230KB）
MIN_ZIPF = 3.0
WORD = re.compile(r"[a-z]+(?:'[a-z]+)*")

HEADER = """\
# English word frequencies (Zipf scale x 100), one line per value: "<zipf*100> <word> <word> ..."
# Derived from wordfreq <https://github.com/rspeer/wordfreq> by Robyn Speer
# (filtered to Zipf >= 3.0 and rounded). Licensed under CC BY-SA 4.0
# <https://creativecommons.org/licenses/by-sa/4.0/>.
# wordfreq includes data from SUBTLEX (Brysbaert et al.; SUBTLEX is freely available data),
# OpenSubtitles <http://www.opensubtitles.org/> (via OPUS OpenSubtitles 2018),
# Google Books Ngrams <http://books.google.com/ngrams>, Wikipedia, ParaCrawl,
# the Leeds Internet Corpus, and other sources listed in the wordfreq README.
"""

buckets = defaultdict(list)
for word in top_n_list("en", 10**6):
    if not WORD.fullmatch(word):
        continue
    zipf = zipf_frequency(word, "en")
    if zipf < MIN_ZIPF:
        break
    buckets[round(zipf * 100)].append(word)

lines = [f"{value} {' '.join(words)}" for value, words in sorted(buckets.items(), reverse=True)]
out = Path(__file__).parent.parent / "src" / "data" / "en-word-frequency.txt"
out.write_text(HEADER + "\n".join(lines) + "\n", encoding="utf-8", newline="\n")
print(f"{sum(map(len, buckets.values()))} words -> {out}")
