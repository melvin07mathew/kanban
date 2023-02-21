from workers import celery
from celery.schedules import crontab

@celery.on_after_finalize.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(crontab(minute=0, hour=0),auto_update_deadline,name='deadline check on everyday midnight')
    # sender.add_periodic_task(10.0,monthly_report,name='sending report to user')
    # sender.add_periodic_task(10.0,send_the_mail,name='sending mail to user')
    sender.add_periodic_task(crontab(minute=0, hour=9),send_the_mail,name='sending report to user')
    sender.add_periodic_task(crontab(minute=0, hour=9,day_of_month=1),monthly_report,name='sending mail to user')


@celery.task()
def auto_update_deadline():
    import datetime as dp
    from datetime import datetime
    from app import db,Lists,Cards
    list_data_user=Lists.query.all()
    card1=Cards.query.all()
    for i in list_data_user:
        for j in card1:
            if i.list_id == j.list_list_id and j.status == "YET TO COMPLETE":
                card_id=j.card_id
                d1=datetime.strptime(j.deadline,'%Y-%m-%d').date()
                d2=dp.date.today()
                if d2  > d1:
                    card_update=Cards.query.filter(Cards.card_id==card_id).first()
                    card_update.status = "DEADLINE PASSED"
                    db.session.commit()
    return "updating deadline is done"

@celery.task()
def import_list(user_id):
    from app import db,Lists
    Lists_query = Lists.query.filter(Lists.user_user_id==user_id).all()
    f = open('{}list.csv'.format(user_id), 'w')
    f.write("list title" + '\n')
    for data in Lists_query:
        f.write(data.list_title + '\n')
    f.close()
    return "completed"

@celery.task()
def import_cards(list_id):
    from flask import send_file
    from app import db,Cards
    import pandas as pd
    cards_query = Cards.query.filter(Cards.list_list_id == list_id).all()
    data_list=[]
    for card in cards_query:
        s={
            "card_title":card.card_title,
            "content":card.content,
            "deadline":card.deadline,
            "status":card.status,  
            "completed_on":card.completed_on         
        }
        data_list.append(s)
        s=dict()
    df = pd.DataFrame(data_list)
    df.to_csv('{}card.csv'.format(list_id))
    return "completed"




# sending mail as deadline reminder

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders

SMPTP_SERVER_HOST = "localhost"
SMPTP_SERVER_PORT = 1025
SENDER_ADDRESS = "sample@email.com"
SENDER_PASSWORD = ""


@celery.task()
def send_email(to_address,subject,message,attachment_file=None):
    msg = MIMEMultipart()
    msg["From"] = SENDER_ADDRESS
    msg["To"] = to_address
    msg["Subject"] = subject

    msg.attach(MIMEText(message,"html"))

    if attachment_file:
        with open(attachment_file,"rb") as attachment:
            part = MIMEBase("application" , "octet-stream")
            part.set_payload(attachment.read())
        encoders.encode_base64(part)
        part.add_header(
            "Content-Disposition" , f"attachment; filename = {attachment_file}",
        )
        msg.attach(part)


    s= smtplib.SMTP(host=SMPTP_SERVER_HOST,port=SMPTP_SERVER_PORT)
    s.login(SENDER_ADDRESS,SENDER_PASSWORD)
    s.send_message(msg)
    s.quit()
    return True



@celery.task()
def send_the_mail():
    import datetime as dp
    from datetime import datetime
    from app import db,User,Lists,Cards
    from jinja2 import Template
    list_data_user=Lists.query.all()
    card1=Cards.query.all()
    for i in list_data_user:
        for j in card1:
            if i.list_id == j.list_list_id and j.status == "YET TO COMPLETE":
                list_id=j.list_list_id
                d1=datetime.strptime(j.deadline,'%Y-%m-%d').date()
                d2=dp.date.today()
                d3 = d1-d2
                d4 = d3.days
                if d4 == 1:
                    user_id_query=Lists.query.filter(Lists.list_id==list_id).first()
                    user_id = user_id_query.user_user_id
                    mail_data_query = User.query.filter(User.id == user_id).first() 
                    user_name = mail_data_query.user_name
                    list_name = i.list_title
                    card_title = j.card_title
                    email_id = mail_data_query.email
                    with open("mail.html") as file_:
                        template = Template(file_.read())
                        message = template.render(user_name=user_name,card_title=card_title,list_title=list_name)
                    send_email(email_id,subject="Deadline remainder",message=message)
    return "mail send successfully"

# end here

# monthly report start here
@celery.task()
def monthly_report():
    import matplotlib.pyplot as plt
    from app import db,User,Lists,Cards
    from weasyprint import HTML
    from jinja2 import Template
    plt.switch_backend('agg')
    user=User.query.all()
    for user_in in user:
        user_id_data = user_in.id
        user_name = user_in.user_name
        email = user_in.email
        list_data_user=Lists.query.filter(Lists.user_user_id==user_id_data).all()
        cards_data=Cards.query.all()
        s=dict()
        for i in list_data_user:
            s[i.list_id]={}
            s[i.list_id]['complete']=0
            s[i.list_id]['yet_to_complete']=0
            s[i.list_id]['deadline_passed']=0
            d=dict()

            for j in cards_data:
                if i.list_id == j.list_list_id and j.status == "COMPLETED":
                    s[j.list_list_id]['complete']+=1  
                    try:
                        d[j.completed_on]+=1
                    except KeyError:
                        d[j.completed_on]=1      
                elif i.list_id == j.list_list_id and j.status == "YET TO COMPLETE":
                    s[j.list_list_id]['yet_to_complete']+=1
                    d[j.deadline]=0
                elif i.list_id == j.list_list_id and j.status == "DEADLINE PASSED":
                    s[j.list_list_id]['deadline_passed']+=1
                    d[j.deadline]=0


            x=[]
            y=[]
            for key,value in d.items():
                x.append(key)
                y.append(value)

            plt.xlabel("COMPLETED ON")
            plt.ylabel("NO. OF CARDS")
            plt.bar(x,y)
            plt.savefig("static/"+f'{user_id_data}_'+f'{i.list_id}'+".png")
            plt.close()
    
    with open("monthly_report.html") as file_:
        template = Template(file_.read())
        message = template.render(user_name=user_name,list=list_data_user,cards=cards_data,status=s,user_id=user_id_data)
        html = HTML(string=message)
        file_name = ("{}.pdf".format(user_name))
        html.write_pdf(target=file_name)
        send_email(email,subject="Monthly Report",message="Your monthly report is attached below",attachment_file="{}.pdf".format(user_name))
        




# end here