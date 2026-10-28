# U1 search-api: parity runs (2026-10-28)

Local: old Next routes (apps/app, next dev) vs new entries (apps/api), both on the DEV Neon branch (ep-royal-night, a copy of production). Run 1: client + public (0 activated workers then). Run 2 stopped by the 25-min limit at Canberra (script did one lookup per worker; batched on feat/search-callers). After activating 1828 ACTIVE workers on the DEV branch only: part A (6 places, both searches), part B (public, stopped by the user after 6 of 17 places: same statement as the client search).

Result: 0 unexplained differences.

## parity.txt
```
old: http://localhost:3000  new: http://127.0.0.1:4000  places: 23
client (no place)                                       old 1617  new 1617  same
public (no place)                                       old    0  new    0  same
-- Parramatta, NSW 2150: suburb -33.8140,151.0069
client Parramatta, NSW 2150 5 km                        old   53  new   54  only-old=2 only-new=3  no HOME row (FR-4): 2; legacy point ≠ HOME point: 1; at the radius edge (Google point vs suburb centre): 2
client Parramatta, NSW 2150 20 km                       old  244  new  237  only-old=11 only-new=4  no HOME row (FR-4): 7; legacy point ≠ HOME point: 4; at the radius edge (Google point vs suburb centre): 4
client Parramatta, NSW 2150 20 km + service             old  204  new  198  only-old=9 only-new=3  no HOME row (FR-4): 7; legacy point ≠ HOME point: 3; at the radius edge (Google point vs suburb centre): 2
client Parramatta, NSW 2150 50 km                       old  357  new  345  only-old=12 only-new=0  no HOME row (FR-4): 12
public Parramatta, NSW 2150 5 km                        old    0  new    0  same
public Parramatta, NSW 2150 20 km                       old    0  new    0  same
public Parramatta, NSW 2150 20 km + service             old    0  new    0  same
public Parramatta, NSW 2150 500 km                      old    0  new    0  same
-- Sydney, NSW 2000: suburb -33.8688,151.2093
client Sydney, NSW 2000 5 km                            old   17  new   17  only-old=1 only-new=1  legacy point ≠ HOME point: 2
client Sydney, NSW 2000 20 km                           old  179  new  175  only-old=9 only-new=5  no HOME row (FR-4): 6; legacy point ≠ HOME point: 4; at the radius edge (Google point vs suburb centre): 4
client Sydney, NSW 2000 20 km + service                 old  139  new  134  only-old=8 only-new=3  no HOME row (FR-4): 5; legacy point ≠ HOME point: 2; at the radius edge (Google point vs suburb centre): 4
client Sydney, NSW 2000 50 km                           old  355  new  342  only-old=14 only-new=1  no HOME row (FR-4): 13; legacy point ≠ HOME point: 2
public Sydney, NSW 2000 5 km                            old    0  new    0  same
public Sydney, NSW 2000 20 km                           old    0  new    0  same
public Sydney, NSW 2000 20 km + service                 old    0  new    0  same
public Sydney, NSW 2000 500 km                          old    0  new    0  same
-- Penrith, NSW 2750: suburb -33.7454,150.6936
client Penrith, NSW 2750 5 km                           old    5  new    6  only-old=1 only-new=2  legacy point ≠ HOME point: 2; at the radius edge (Google point vs suburb centre): 1
client Penrith, NSW 2750 20 km                          old   39  new   50  only-old=1 only-new=12  no HOME row (FR-4): 1; legacy point ≠ HOME point: 11; at the radius edge (Google point vs suburb centre): 1
client Penrith, NSW 2750 20 km + service                old   35  new   45  only-old=1 only-new=11  no HOME row (FR-4): 1; legacy point ≠ HOME point: 10; at the radius edge (Google point vs suburb centre): 1
client Penrith, NSW 2750 50 km                          old  318  new  309  only-old=10 only-new=1  no HOME row (FR-4): 10; legacy point ≠ HOME point: 1
public Penrith, NSW 2750 5 km                           old    0  new    0  same
public Penrith, NSW 2750 20 km                          old    0  new    0  same
public Penrith, NSW 2750 20 km + service                old    0  new    0  same
public Penrith, NSW 2750 500 km                         old    0  new    0  same
-- Newcastle, NSW 2300: suburb -32.9264,151.7788
client Newcastle, NSW 2300 5 km                         old    5  new    6  only-old=0 only-new=1  legacy point ≠ HOME point: 1
client Newcastle, NSW 2300 20 km                        old   33  new   30  only-old=3 only-new=0  no HOME row (FR-4): 2; legacy point ≠ HOME point: 1
client Newcastle, NSW 2300 20 km + service              old   28  new   25  only-old=3 only-new=0  no HOME row (FR-4): 2; legacy point ≠ HOME point: 1
client Newcastle, NSW 2300 50 km                        old   59  new   56  only-old=3 only-new=0  no HOME row (FR-4): 3
public Newcastle, NSW 2300 5 km                         old    0  new    0  same
public Newcastle, NSW 2300 20 km                        old    0  new    0  same
public Newcastle, NSW 2300 20 km + service              old    0  new    0  same
public Newcastle, NSW 2300 500 km                       old    0  new    0  same
-- Wollongong, NSW 2500: suburb -34.4278,150.8931
client Wollongong, NSW 2500 5 km                        old    5  new    5  same
client Wollongong, NSW 2500 20 km                       old   19  new   18  only-old=1 only-new=0  legacy point ≠ HOME point: 1
client Wollongong, NSW 2500 20 km + service             old   18  new   17  only-old=1 only-new=0  legacy point ≠ HOME point: 1
client Wollongong, NSW 2500 50 km                       old   73  new   67  only-old=6 only-new=0  no HOME row (FR-4): 2; legacy point ≠ HOME point: 2; at the radius edge (Google point vs suburb centre): 2
public Wollongong, NSW 2500 5 km                        old    0  new    0  same
public Wollongong, NSW 2500 20 km                       old    0  new    0  same
public Wollongong, NSW 2500 20 km + service             old    0  new    0  same
public Wollongong, NSW 2500 500 km                      old    0  new    0  same
-- Dubbo, NSW 2830: suburb -32.2790,148.6016
client Dubbo, NSW 2830 5 km                             old    0  new    0  same
client Dubbo, NSW 2830 20 km                            old    0  new    0  same
client Dubbo, NSW 2830 20 km + service                  old    0  new    0  same
client Dubbo, NSW 2830 50 km                            old    0  new    0  same
public Dubbo, NSW 2830 5 km                             old    0  new    0  same
public Dubbo, NSW 2830 20 km                            old    0  new    0  same
public Dubbo, NSW 2830 20 km + service                  old    0  new    0  same
public Dubbo, NSW 2830 500 km                           old    0  new    0  same
-- Melbourne, VIC 3000: suburb -37.8250,144.9715
client Melbourne, VIC 3000 5 km                         old   25  new   27  only-old=0 only-new=2  at the radius edge (Google point vs suburb centre): 2
client Melbourne, VIC 3000 20 km                        old  160  new  152  only-old=10 only-new=2  no HOME row (FR-4): 6; at the radius edge (Google point vs suburb centre): 6
client Melbourne, VIC 3000 20 km + service              old  142  new  135  only-old=9 only-new=2  no HOME row (FR-4): 5; at the radius edge (Google point vs suburb centre): 6
client Melbourne, VIC 3000 50 km                        old  462  new  447  only-old=15 only-new=0  no HOME row (FR-4): 14; legacy point ≠ HOME point: 1
public Melbourne, VIC 3000 5 km                         old    0  new    0  same
public Melbourne, VIC 3000 20 km                        old    0  new    0  same
public Melbourne, VIC 3000 20 km + service              old    0  new    0  same
public Melbourne, VIC 3000 500 km                       old    0  new    0  same
-- Geelong, VIC 3220: suburb -38.1499,144.3617
client Geelong, VIC 3220 5 km                           old    1  new    2  only-old=0 only-new=1  legacy point ≠ HOME point: 1
client Geelong, VIC 3220 20 km                          old    6  new    3  only-old=3 only-new=0  no HOME row (FR-4): 3
client Geelong, VIC 3220 20 km + service                old    5  new    2  only-old=3 only-new=0  no HOME row (FR-4): 3
client Geelong, VIC 3220 50 km                          old   81  new   77  only-old=5 only-new=1  no HOME row (FR-4): 4; at the radius edge (Google point vs suburb centre): 1; legacy point ≠ HOME point: 1
public Geelong, VIC 3220 5 km                           old    0  new    0  same
public Geelong, VIC 3220 20 km                          old    0  new    0  same
public Geelong, VIC 3220 20 km + service                old    0  new    0  same
public Geelong, VIC 3220 500 km                         old    0  new    0  same
-- Ballarat Central, VIC 3350: suburb -37.5621,143.8503
client Ballarat Central, VIC 3350 5 km                  old    3  new    3  same
client Ballarat Central, VIC 3350 20 km                 old    3  new    3  same
client Ballarat Central, VIC 3350 20 km + service       old    3  new    3  same
client Ballarat Central, VIC 3350 50 km                 old    3  new    3  same
public Ballarat Central, VIC 3350 5 km                  old    0  new    0  same
public Ballarat Central, VIC 3350 20 km                 old    0  new    0  same
public Ballarat Central, VIC 3350 20 km + service       old    0  new    0  same
public Ballarat Central, VIC 3350 500 km                old    0  new    0  same
-- Brisbane City, QLD 4000: suburb -27.4698,153.0251
client Brisbane City, QLD 4000 5 km                     old   10  new    8  only-old=2 only-new=0  no HOME row (FR-4): 1; at the radius edge (Google point vs suburb centre): 1
client Brisbane City, QLD 4000 20 km                    old   66  new   67  only-old=1 only-new=2  no HOME row (FR-4): 1; legacy point ≠ HOME point: 1; at the radius edge (Google point vs suburb centre): 1
client Brisbane City, QLD 4000 20 km + service          old   58  new   59  only-old=1 only-new=2  no HOME row (FR-4): 1; legacy point ≠ HOME point: 1; at the radius edge (Google point vs suburb centre): 1
client Brisbane City, QLD 4000 50 km                    old  192  new  190  only-old=3 only-new=1  no HOME row (FR-4): 3; legacy point ≠ HOME point: 1
public Brisbane City, QLD 4000 5 km                     old    0  new    0  same
public Brisbane City, QLD 4000 20 km                    old    0  new    0  same
public Brisbane City, QLD 4000 20 km + service          old    0  new    0  same
public Brisbane City, QLD 4000 500 km                   old    0  new    0  same
-- Southport, QLD 4215: suburb -27.9731,153.4018
client Southport, QLD 4215 5 km                         old   10  new    9  only-old=2 only-new=1  no HOME row (FR-4): 2; at the radius edge (Google point vs suburb centre): 1
client Southport, QLD 4215 20 km                        old   31  new   28  only-old=3 only-new=0  no HOME row (FR-4): 3
client Southport, QLD 4215 20 km + service              old   28  new   26  only-old=2 only-new=0  no HOME row (FR-4): 2
client Southport, QLD 4215 50 km                        old   98  new   93  only-old=5 only-new=0  no HOME row (FR-4): 4; at the radius edge (Google point vs suburb centre): 1
public Southport, QLD 4215 5 km                         old    0  new    0  same
public Southport, QLD 4215 20 km                        old    0  new    0  same
public Southport, QLD 4215 20 km + service              old    0  new    0  same
public Southport, QLD 4215 500 km                       old    0  new    0  same
-- Townsville City, QLD 4810: suburb -19.2590,146.8169
client Townsville City, QLD 4810 5 km                   old    1  new    1  same
client Townsville City, QLD 4810 20 km                  old    1  new    1  same
client Townsville City, QLD 4810 20 km + service        old    1  new    1  same
client Townsville City, QLD 4810 50 km                  old    1  new    1  same
public Townsville City, QLD 4810 5 km                   old    0  new    0  same
public Townsville City, QLD 4810 20 km                  old    0  new    0  same
public Townsville City, QLD 4810 20 km + service        old    0  new    0  same
public Townsville City, QLD 4810 500 km                 old    0  new    0  same
-- Toowoomba City, QLD 4350: suburb -27.5598,151.9507
client Toowoomba City, QLD 4350 5 km                    old    2  new    0  only-old=2 only-new=0  no HOME row (FR-4): 2
client Toowoomba City, QLD 4350 20 km                   old    2  new    0  only-old=2 only-new=0  no HOME row (FR-4): 2
client Toowoomba City, QLD 4350 20 km + service         old    1  new    0  only-old=1 only-new=0  no HOME row (FR-4): 1
client Toowoomba City, QLD 4350 50 km                   old    5  new    3  only-old=2 only-new=0  no HOME row (FR-4): 2
public Toowoomba City, QLD 4350 5 km                    old    0  new    0  same
public Toowoomba City, QLD 4350 20 km                   old    0  new    0  same
public Toowoomba City, QLD 4350 20 km + service         old    0  new    0  same
public Toowoomba City, QLD 4350 500 km                  old    0  new    0  same
-- Adelaide, SA 5000: suburb -34.9287,138.6010
client Adelaide, SA 5000 5 km                           old    8  new    7  only-old=1 only-new=0  at the radius edge (Google point vs suburb centre): 1
client Adelaide, SA 5000 20 km                          old   62  new   62  same
client Adelaide, SA 5000 20 km + service                old   58  new   58  same
client Adelaide, SA 5000 50 km                          old   81  new   81  same
public Adelaide, SA 5000 5 km                           old    0  new    0  same
public Adelaide, SA 5000 20 km                          old    0  new    0  same
public Adelaide, SA 5000 20 km + service                old    0  new    0  same
public Adelaide, SA 5000 500 km                         old    0  new    0  same
-- Perth, WA 6000: suburb -31.9539,115.8582
client Perth, WA 6000 5 km                              old   18  new   16  only-old=2 only-new=0  no HOME row (FR-4): 1; at the radius edge (Google point vs suburb centre): 1
client Perth, WA 6000 20 km                             old  116  new  110  only-old=6 only-new=0  no HOME row (FR-4): 3; legacy point ≠ HOME point: 3
client Perth, WA 6000 20 km + service                   old  105  new   99  only-old=6 only-new=0  no HOME row (FR-4): 3; legacy point ≠ HOME point: 3
client Perth, WA 6000 50 km                             old  184  new  180  only-old=5 only-new=1  no HOME row (FR-4): 4; legacy point ≠ HOME point: 2
public Perth, WA 6000 5 km                              old    0  new    0  same
public Perth, WA 6000 20 km                             old    0  new    0  same
public Perth, WA 6000 20 km + service                   old    0  new    0  same
public Perth, WA 6000 500 km                            old    0  new    0  same
-- Hobart, TAS 7000: suburb -42.8821,147.3273
client Hobart, TAS 7000 5 km                            old    8  new    8  only-old=1 only-new=1  no HOME row (FR-4): 1; legacy point ≠ HOME point: 1
client Hobart, TAS 7000 20 km                           old   25  new   24  only-old=1 only-new=0  no HOME row (FR-4): 1
client Hobart, TAS 7000 20 km + service                 old   21  new   20  only-old=1 only-new=0  no HOME row (FR-4): 1
client Hobart, TAS 7000 50 km                           old   25  new   24  only-old=1 only-new=0  no HOME row (FR-4): 1
public Hobart, TAS 7000 5 km                            old    0  new    0  same
public Hobart, TAS 7000 20 km                           old    0  new    0  same
public Hobart, TAS 7000 20 km + service                 old    0  new    0  same
public Hobart, TAS 7000 500 km                          old    0  new    0  same
-- Canberra, ACT 2601: no place (searched without one)
```

## parity-rest.txt
```
old: http://localhost:3000  new: http://127.0.0.1:4000  places: 7
client (no place)                                       old 1617  new 1617  same
public (no place)                                       old    0  new    0  same
-- Canberra, ACT 2601: no place (searched without one)
client Canberra, ACT 2601 5 km                          old    0  new 1828  only-old=0 only-new=1828  no place for this text (FD-Q1 A): 1091; legacy point ≠ HOME point: 668; no HOME row (FR-4): 69
client Canberra, ACT 2601 20 km                         old    6  new 1828  only-old=0 only-new=1822  no place for this text (FD-Q1 A): 1088; legacy point ≠ HOME point: 667; no HOME row (FR-4): 67
client Canberra, ACT 2601 20 km + service               old    5  new 1617  only-old=0 only-new=1612  no place for this text (FD-Q1 A): 949; legacy point ≠ HOME point: 612; no HOME row (FR-4): 51
client Canberra, ACT 2601 50 km                         old    7  new 1828  only-old=0 only-new=1821  no place for this text (FD-Q1 A): 1088; legacy point ≠ HOME point: 667; no HOME row (FR-4): 66
public Canberra, ACT 2601 5 km                          old    0  new 1828  only-old=0 only-new=1828  no place for this text (FD-Q1 A): 1091; legacy point ≠ HOME point: 668; no HOME row (FR-4): 69
```

## parity-a.txt
```
old: http://localhost:3000  new: http://127.0.0.1:4000  places: 6
client (no place)                                       old 1617  new 1617  same
public (no place)                                       old 1617  new 1617  same
-- Darwin City, NT 800: suburb -12.4634,130.8457
client Darwin City, NT 800 5 km                         old   19  new   19  only-old=2 only-new=2  no HOME row (FR-4): 2; legacy point ≠ HOME point: 2
client Darwin City, NT 800 20 km                        old   36  new   32  only-old=4 only-new=0  no HOME row (FR-4): 4
client Darwin City, NT 800 20 km + service              old   32  new   29  only-old=3 only-new=0  no HOME row (FR-4): 3
client Darwin City, NT 800 50 km                        old   36  new   32  only-old=4 only-new=0  no HOME row (FR-4): 4
public Darwin City, NT 800 5 km                         old   19  new   19  only-old=2 only-new=2  no HOME row (FR-4): 2; legacy point ≠ HOME point: 2
public Darwin City, NT 800 20 km                        old   36  new   32  only-old=4 only-new=0  no HOME row (FR-4): 4
public Darwin City, NT 800 20 km + service              old   32  new   29  only-old=3 only-new=0  no HOME row (FR-4): 3
public Darwin City, NT 800 500 km                       old   36  new   32  only-old=4 only-new=0  no HOME row (FR-4): 4
-- Alice Springs, NT 0870: suburb -23.6980,133.8808
client Alice Springs, NT 0870 5 km                      old   31  new   31  same
client Alice Springs, NT 0870 20 km                     old   31  new   31  same
client Alice Springs, NT 0870 20 km + service           old   31  new   31  same
client Alice Springs, NT 0870 50 km                     old   31  new   31  same
public Alice Springs, NT 0870 5 km                      old   31  new   31  same
public Alice Springs, NT 0870 20 km                     old   31  new   31  same
public Alice Springs, NT 0870 20 km + service           old   31  new   31  same
public Alice Springs, NT 0870 500 km                    old   33  new   31  only-old=2 only-new=0  no HOME row (FR-4): 2
-- Cairns City, QLD 4870: suburb -16.9205,145.7777
client Cairns City, QLD 4870 5 km                       old    0  new    0  same
client Cairns City, QLD 4870 20 km                      old    0  new    0  same
client Cairns City, QLD 4870 20 km + service            old    0  new    0  same
client Cairns City, QLD 4870 50 km                      old    0  new    0  same
public Cairns City, QLD 4870 5 km                       old    0  new    0  same
public Cairns City, QLD 4870 20 km                      old    0  new    0  same
public Cairns City, QLD 4870 20 km + service            old    0  new    0  same
public Cairns City, QLD 4870 500 km                     old    1  new    1  same
-- 2150: postcode -33.8183,151.0090
client 2150 5 km                                        old   53  new   53  only-old=2 only-new=2  no HOME row (FR-4): 2; at the radius edge (Google point vs suburb centre): 2
client 2150 20 km                                       old  244  new  238  only-old=9 only-new=3  no HOME row (FR-4): 7; legacy point ≠ HOME point: 4; at the radius edge (Google point vs suburb centre): 1
client 2150 20 km + service                             old  204  new  198  only-old=8 only-new=2  no HOME row (FR-4): 7; legacy point ≠ HOME point: 3
client 2150 50 km                                       old  357  new  345  only-old=12 only-new=0  no HOME row (FR-4): 12
public 2150 5 km                                        old   53  new   53  only-old=2 only-new=2  no HOME row (FR-4): 2; at the radius edge (Google point vs suburb centre): 2
public 2150 20 km                                       old  244  new  238  only-old=9 only-new=3  no HOME row (FR-4): 7; legacy point ≠ HOME point: 4; at the radius edge (Google point vs suburb centre): 1
public 2150 20 km + service                             old  204  new  198  only-old=8 only-new=2  no HOME row (FR-4): 7; legacy point ≠ HOME point: 3
public 2150 500 km                                      old  497  new  477  only-old=20 only-new=0  no HOME row (FR-4): 20
-- Parramatta: name -33.8140,151.0069
client Parramatta 5 km                                  old   53  new   54  only-old=2 only-new=3  no HOME row (FR-4): 2; legacy point ≠ HOME point: 1; at the radius edge (Google point vs suburb centre): 2
client Parramatta 20 km                                 old  245  new  237  only-old=10 only-new=2  no HOME row (FR-4): 7; legacy point ≠ HOME point: 4; at the radius edge (Google point vs suburb centre): 1
client Parramatta 20 km + service                       old  206  new  198  only-old=9 only-new=1  no HOME row (FR-4): 7; legacy point ≠ HOME point: 3
client Parramatta 50 km                                 old  357  new  345  only-old=12 only-new=0  no HOME row (FR-4): 12
public Parramatta 5 km                                  old   53  new   54  only-old=2 only-new=3  no HOME row (FR-4): 2; legacy point ≠ HOME point: 1; at the radius edge (Google point vs suburb centre): 2
public Parramatta 20 km                                 old  245  new  237  only-old=10 only-new=2  no HOME row (FR-4): 7; legacy point ≠ HOME point: 4; at the radius edge (Google point vs suburb centre): 1
public Parramatta 20 km + service                       old  206  new  198  only-old=9 only-new=1  no HOME row (FR-4): 7; legacy point ≠ HOME point: 3
public Parramatta 500 km                                old  497  new  477  only-old=20 only-new=0  no HOME row (FR-4): 20
-- Gold Coast: no place (searched without one)
client Gold Coast 5 km                                  old   10  new 1828  only-old=0 only-new=1818  no place for this text (FD-Q1 A): 1818
client Gold Coast 20 km                                 old   31  new 1828  only-old=0 only-new=1797  no place for this text (FD-Q1 A): 1797
client Gold Coast 20 km + service                       old   28  new 1617  only-old=0 only-new=1589  no place for this text (FD-Q1 A): 1589
client Gold Coast 50 km                                 old  100  new 1828  only-old=0 only-new=1728  no place for this text (FD-Q1 A): 1728
public Gold Coast 5 km                                  old   10  new 1828  only-old=0 only-new=1818  no place for this text (FD-Q1 A): 1818
public Gold Coast 20 km                                 old   31  new 1828  only-old=0 only-new=1797  no place for this text (FD-Q1 A): 1797
public Gold Coast 20 km + service                       old   28  new 1617  only-old=0 only-new=1589  no place for this text (FD-Q1 A): 1589
public Gold Coast 500 km                                old  390  new 1828  only-old=0 only-new=1438  no place for this text (FD-Q1 A): 1438
parity: every difference explained
```

## parity-b.txt
```
old: http://localhost:3000  new: http://127.0.0.1:4000  places: 17
client (no place)                                       old 1617  new 1617  same
public (no place)                                       old 1617  new 1617  same
-- Parramatta, NSW 2150: suburb -33.8140,151.0069
public Parramatta, NSW 2150 5 km                        old   53  new   54  only-old=2 only-new=3  no HOME row (FR-4): 2; legacy point ≠ HOME point: 1; at the radius edge (Google point vs suburb centre): 2
public Parramatta, NSW 2150 20 km                       old  244  new  237  only-old=11 only-new=4  no HOME row (FR-4): 7; legacy point ≠ HOME point: 4; at the radius edge (Google point vs suburb centre): 4
public Parramatta, NSW 2150 20 km + service             old  204  new  198  only-old=9 only-new=3  no HOME row (FR-4): 7; legacy point ≠ HOME point: 3; at the radius edge (Google point vs suburb centre): 2
public Parramatta, NSW 2150 500 km                      old  497  new  477  only-old=20 only-new=0  no HOME row (FR-4): 20
-- Sydney, NSW 2000: suburb -33.8688,151.2093
public Sydney, NSW 2000 5 km                            old   17  new   17  only-old=1 only-new=1  legacy point ≠ HOME point: 2
public Sydney, NSW 2000 20 km                           old  179  new  175  only-old=9 only-new=5  no HOME row (FR-4): 6; legacy point ≠ HOME point: 4; at the radius edge (Google point vs suburb centre): 4
public Sydney, NSW 2000 20 km + service                 old  139  new  134  only-old=8 only-new=3  no HOME row (FR-4): 5; legacy point ≠ HOME point: 2; at the radius edge (Google point vs suburb centre): 4
public Sydney, NSW 2000 500 km                          old  497  new  477  only-old=20 only-new=0  no HOME row (FR-4): 20
-- Penrith, NSW 2750: suburb -33.7454,150.6936
public Penrith, NSW 2750 5 km                           old    5  new    6  only-old=1 only-new=2  legacy point ≠ HOME point: 2; at the radius edge (Google point vs suburb centre): 1
public Penrith, NSW 2750 20 km                          old   39  new   50  only-old=1 only-new=12  no HOME row (FR-4): 1; legacy point ≠ HOME point: 11; at the radius edge (Google point vs suburb centre): 1
public Penrith, NSW 2750 20 km + service                old   35  new   45  only-old=1 only-new=11  no HOME row (FR-4): 1; legacy point ≠ HOME point: 10; at the radius edge (Google point vs suburb centre): 1
public Penrith, NSW 2750 500 km                         old  497  new  477  only-old=20 only-new=0  no HOME row (FR-4): 20
-- Newcastle, NSW 2300: suburb -32.9264,151.7788
public Newcastle, NSW 2300 5 km                         old    5  new    6  only-old=0 only-new=1  legacy point ≠ HOME point: 1
public Newcastle, NSW 2300 20 km                        old   33  new   30  only-old=3 only-new=0  no HOME row (FR-4): 2; legacy point ≠ HOME point: 1
public Newcastle, NSW 2300 20 km + service              old   28  new   25  only-old=3 only-new=0  no HOME row (FR-4): 2; legacy point ≠ HOME point: 1
public Newcastle, NSW 2300 500 km                       old  516  new  498  only-old=19 only-new=1  no HOME row (FR-4): 19; legacy point ≠ HOME point: 1
-- Wollongong, NSW 2500: suburb -34.4278,150.8931
public Wollongong, NSW 2500 5 km                        old    5  new    5  same
public Wollongong, NSW 2500 20 km                       old   19  new   18  only-old=1 only-new=0  legacy point ≠ HOME point: 1
public Wollongong, NSW 2500 20 km + service             old   18  new   17  only-old=1 only-new=0  legacy point ≠ HOME point: 1
public Wollongong, NSW 2500 500 km                      old  497  new  477  only-old=20 only-new=0  no HOME row (FR-4): 20
-- Dubbo, NSW 2830: suburb -32.2790,148.6016
public Dubbo, NSW 2830 5 km                             old    0  new    0  same
public Dubbo, NSW 2830 20 km                            old    0  new    0  same
public Dubbo, NSW 2830 20 km + service                  old    0  new    0  same
public Dubbo, NSW 2830 500 km                           old  497  new  478  only-old=19 only-new=0  no HOME row (FR-4): 19
-- Melbourne, VIC 3000: suburb -37.8250,144.9715
public Melbourne, VIC 3000 5 km                         old   25  new   27  only-old=0 only-new=2  at the radius edge (Google point vs suburb centre): 2
public Melbourne, VIC 3000 20 km                        old  160  new  152  only-old=10 only-new=2  no HOME row (FR-4): 6; at the radius edge (Google point vs suburb centre): 6
public Melbourne, VIC 3000 20 km + service              old  142  new  135  only-old=9 only-new=2  no HOME row (FR-4): 5; at the radius edge (Google point vs suburb centre): 6
public Melbourne, VIC 3000 500 km                       old  578  new  554  only-old=25 only-new=1  no HOME row (FR-4): 25; legacy point ≠ HOME point: 1
-- Geelong, VIC 3220: suburb -38.1499,144.3617
public Geelong, VIC 3220 5 km                           old    1  new    2  only-old=0 only-new=1  legacy point ≠ HOME point: 1
public Geelong, VIC 3220 20 km                          old    6  new    3  only-old=3 only-new=0  no HOME row (FR-4): 3
public Geelong, VIC 3220 20 km + service                old    5  new    2  only-old=3 only-new=0  no HOME row (FR-4): 3
public Geelong, VIC 3220 500 km                         old  570  new  549  only-old=22 only-new=1  no HOME row (FR-4): 22; legacy point ≠ HOME point: 1
-- Ballarat Central, VIC 3350: suburb -37.5621,143.8503
public Ballarat Central, VIC 3350 5 km                  old    3  new    3  same
public Ballarat Central, VIC 3350 20 km                 old    3  new    3  same
public Ballarat Central, VIC 3350 20 km + service       old    3  new    3  same
public Ballarat Central, VIC 3350 500 km                old  556  new  536  only-old=21 only-new=1  no HOME row (FR-4): 21; legacy point ≠ HOME point: 1
-- Brisbane City, QLD 4000: suburb -27.4698,153.0251
public Brisbane City, QLD 4000 5 km                     old   10  new    8  only-old=2 only-new=0  no HOME row (FR-4): 1; at the radius edge (Google point vs suburb centre): 1
public Brisbane City, QLD 4000 20 km                    old   66  new   67  only-old=1 only-new=2  no HOME row (FR-4): 1; legacy point ≠ HOME point: 1; at the radius edge (Google point vs suburb centre): 1
public Brisbane City, QLD 4000 20 km + service          old   58  new   59  only-old=1 only-new=2  no HOME row (FR-4): 1; legacy point ≠ HOME point: 1; at the radius edge (Google point vs suburb centre): 1
public Brisbane City, QLD 4000 500 km                   old  388  new  378  only-old=11 only-new=1  no HOME row (FR-4): 11; legacy point ≠ HOME point: 1
-- Southport, QLD 4215: suburb -27.9731,153.4018
public Southport, QLD 4215 5 km                         old   10  new    9  only-old=2 only-new=1  no HOME row (FR-4): 2; at the radius edge (Google point vs suburb centre): 1
public Southport, QLD 4215 20 km                        old   31  new   28  only-old=3 only-new=0  no HOME row (FR-4): 3
public Southport, QLD 4215 20 km + service              old   28  new   26  only-old=2 only-new=0  no HOME row (FR-4): 2
```
