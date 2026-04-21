import os
os.environ['YASDB_HOME'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64'
os.environ['PATH'] = r'I:\APP\dreamops\yashandb-client-23.4.1.109-windows-amd64\lib;' + os.environ.get('PATH', '')

from app.db.yasdb_pool import get_db_session
from app.modules.blog.crud.article_yasdb import get_articles, get_article

db = get_db_session()
try:
    total, articles = get_articles(db, skip=0, limit=10, is_published=None)
    print(f"Total: {total}, Articles: {len(articles)}")
    for a in articles:
        print(f"  ID={a.get('id')} title={a.get('title')[:30]}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
