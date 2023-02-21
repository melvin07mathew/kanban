import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app import db,User,Lists,Cards
from jinja2 import Template
from workers import celery

SMPTP_SERVER_HOST = "localhost"
SMPTP_SERVER_PORT = 1025
SENDER_ADDRESS = "sample@email.com"
SENDER_PASSWORD = ""


@celery.task
def send_email(to_address,subject,message):
    msg = MIMEMultipart()
    msg["From"] = SENDER_ADDRESS
    msg["To"] = to_address
    msg["Subject"] = subject

    msg.attach(MIMEText(message,"html"))

    s= smtplib.SMTP(host=SMPTP_SERVER_HOST,port=SMPTP_SERVER_PORT)
    s.login(SENDER_ADDRESS,SENDER_PASSWORD)
    s.send_message(msg)
    s.quit()
    return True

# def main():
#     import datetime as dp
#     from datetime import datetime
#     list_data_user=Lists.query.all()
#     card1=Cards.query.all()

#     # @celery.task()
#     # def send_mail():
#     for i in list_data_user:
#         for j in card1:
#             if i.list_id == j.list_list_id and j.status == "YET TO COMPLETE":
#                 list_id=j.list_list_id
#                 d1=datetime.strptime(j.deadline,'%Y-%m-%d').date()
#                 d2=dp.date.today()
#                 d3 = d1-d2
#                 d4= d3.days
#                 if d4 == 1:
#                     user_id_query=Lists.query.filter(Lists.list_id==list_id).first()
#                     user_id = user_id_query.user_user_id
#                     mail_data_query = User.query.filter(User.id == user_id).first() 
#                     user_name = mail_data_query.user_name
#                     list_name = i.list_title
#                     card_title = j.card_title
#                     email_id = mail_data_query.email
#                     with open("mail.html") as file_:
#                         template = Template(file_.read())
#                         message = template.render(user_name=user_name,card_title=card_title,list_title=list_name)
#                     send_email(email_id,subject="Deadline remainder",message=message)



# if __name__ == "__main__" :
#     main()


