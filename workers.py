from celery import Celery
from flask import current_app as app

celery = Celery("Application Jobs")

class ContextTasks(celery.Task):
    def __call__(self, *args, **kwargs):
        with app.app_context():
            return self.run(*args, **kwargs)


# celery -A app.celery worker -l info
# celery -A app.celery beat --max-interval 1 -l info
# sudo service redis-server start
# ~/go/bin/MailHog
