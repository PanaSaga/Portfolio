import re,json,collections,math,sys
p=sys.argv[1]; s=open(p,encoding='utf-8').read()
G=[json.loads(m.group(1)) for m in re.finditer(r'^\s*(\{"title".*\}),?\s*$',s,re.M)]
S=[g for g in G if g.get('star')]; N=len(G); P=lambda g:set(g['platforms'])
ca=collections.Counter(x for g in G for x in g.get('genres',[])); cs=collections.Counter(x for g in S for x in g.get('genres',[]))
ORDER=['RPG','샌드박스','액션','비주얼노벨','어드벤처','턴제','전략','협동','수집형','추리']
mT=max(ca[k] for k in ORDER); f=lambda x: math.sqrt(x/mT)*5
rows=',\n'.join(f'      {{ label: "{k}", value: {f(cs[k]):.2f}, base: {f(ca[k]):.2f}, n: {cs[k]}, total: {ca[k]} }}' for k in ORDER)
s,k1=re.subn(r'(    axes: \[\n).*?(\n    \],)',lambda m:m.group(1)+rows+m.group(2),s,count=1,flags=re.S)
s,k0=re.subn(r'\(★ \d+개 · 전체 \d+개 기준\)',f'(★ {len(S)}개 · 전체 {N}개 기준)',s)
off=sum(1 for g in G if P(g)&{'보드게임','TRPG'}); on=N-off
plat=[('PC',sum(1 for g in G if 'PC' in P(g) and '모바일' not in P(g)),'PC {}개'),
 ('모바일',sum(1 for g in G if '모바일' in P(g) and 'PC' not in P(g)),'모바일 {}개'),
 ('PC·모바일',sum(1 for g in G if {'PC','모바일'}<=P(g)),'PC·모바일 겸용 {}개')]+\
 [(k,sum(1 for g in G if k in P(g)),k+(' 게임 {}개' if k!='보드게임' else ' {}개')) for k in ['콘솔','보드게임','TRPG','아케이드','VR']]
tot=sum(n for _,n,_ in plat); pct=[round(n/tot*100) for _,n,_ in plat]; pct[0]+=100-sum(pct)
platstr=',\n'.join(f'      {{ label: "{l}", value: {v}, note: "{t.format(n)}" }}' for (l,n,t),v in zip(plat,pct))
s,k2=re.subn(r'(    platforms: \[\n).*?(\n    \],)',lambda m:m.group(1)+platstr+m.group(2),s,count=1,flags=re.S)
s,k3=re.subn(r"total: \{ title: '총합', value: '\d+', star: '\d+' \}",f"total: {{ title: '총합', value: '{N}', star: '{len(S)}' }}",s)
s,k4=re.subn(r"(title: '온라인 게임', desc: '[^']*', value: )'\d+'",lambda m:m.group(1)+f"'{on}'",s)
s,k5=re.subn(r"(title: '오프라인 게임', desc: '[^']*', value: )'\d+'",lambda m:m.group(1)+f"'{off}'",s)
assert (k1,k2,k3,k4,k5)==(1,1,1,1,1),(k1,k2,k3,k4,k5)
open(p,'w',encoding='utf-8').write(s)
print('총',N,'★',len(S),'온',on,'오프',off); print([(l,n) for l,n,_ in plat],pct)
