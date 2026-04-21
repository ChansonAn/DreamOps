import time
t0 = time.time()
from app.modules.blog.crud.article_yasdb import get_articles
from app.db.yasdb_pool import get_db
with get_db() as db:
    r = get_articles(db, skip=0, limit=2, is_published=True)
    print('OK in', round(time.time()-t0, 1), 's, count=', r[0])
    if r[1]:
        print('First title:', r[1][0].get('title'))
