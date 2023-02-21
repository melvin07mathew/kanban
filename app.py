from flask_sqlalchemy import SQLAlchemy
from flask_security import UserMixin, RoleMixin, auth_required ,current_user
from flask import Flask
from flask_restful import Resource,Api
from flask import send_file
from flask_cors import CORS
from flask import Flask,render_template,request
from flask_security import Security,SQLAlchemyUserDatastore
import workers
import tasks
from flask_caching import Cache
from timeit import default_timer


app=Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///kanban_board_db.sqlite3'
app.config['SECRET_KEY'] = "sweetlikebutter"
app.config['SECURITY_PASSWORD_SALT'] = 'salt'
app.config['WTF_CSRF_ENABLED'] = False
app.config['SECURITY_TOKEN_AUTHENTICATION_HEADER'] = "Authentication-Token"
app.config['SECURITY_PASSWORD_HASH'] = 'bcrypt'
app.config["CELERY_BROKER_URL"]="redis://localhost:6379/1"
app.config["CELERY_RESULT_BACKEND"]="redis://localhost:6379/2"
app.config['REDIS_URL'] = "redis://localhost:6379"
app.config['CACHE_TYPE'] = "RedisCache"
app.config['CACHE_REDIS_HOST'] = "localhost"
app.config['CACHE_REDIS_PORT'] = 6379


db=SQLAlchemy()
db.init_app(app)
api=Api(app)
cache=Cache(app)
app.app_context().push()
CORS(app)
# # SETTING CELERY 
celery = workers.celery


celery.conf.update(
    broker_url = app.config["CELERY_BROKER_URL"],
    result_backend = app.config["CELERY_RESULT_BACKEND"]
)

celery.Task = workers.ContextTasks
# # end
roles_users = db.Table('roles_users',
                        db.Column('user_id',db.Integer(),
                                    db.ForeignKey('user.id')),
                        db.Column('role_id',db.Integer(),
                                    db.ForeignKey('role.id')))

class User(db.Model, UserMixin):
    user_name=db.Column(db.String,unique=True)
    id= db.Column(db.Integer,primary_key=True)
    email = db.Column(db.String,unique=True)
    password = db.Column(db.String(255))
    active = db.Column(db.Boolean())
    fs_uniquifer = db.Column(db.String(255),unique=True,nullable=False)
    roles = db.relationship('Role',secondary=roles_users,backref=db.backref('users',lazy='dynamic'))
    list_relation = db.relationship('Lists',backref="parent",passive_deletes=True)    

class Role(db.Model,RoleMixin):
    id=db.Column(db.Integer(),primary_key=True)
    name = db.Column(db.String(80),unique=True)
    description= db.Column(db.String(255)) 

class Lists(db.Model):
    list_id=db.Column(db.Integer,primary_key=True)
    user_user_id=db.Column(db.Integer,db.ForeignKey('user.id'),nullable=False)
    list_title = db.Column(db.String,nullable=False)
    description = db.Column(db.String,nullable=False)
    cards_relation = db.relationship('Cards',backref="parent",passive_deletes=True,lazy="subquery") 

class Cards(db.Model):
    card_id = db.Column(db.Integer,primary_key=True,autoincrement=True)
    card_title = db.Column(db.String,nullable=False)
    content = db.Column(db.String,nullable=False)
    deadline = db.Column(db.String,nullable=False)
    status = db.Column(db.String,nullable=False)
    completed_on = db.Column(db.String)
    list_list_id = db.Column(db.Integer,db.ForeignKey('lists.list_id'),nullable=False)

# for flask security usage
user_datastore = SQLAlchemyUserDatastore(db,User,Role)
sec = Security()
sec.init_app(app,user_datastore)
#done

# @app.before_first_request
# def create_db():
#     db.create_all()
#     if not user_datastore.find_user(email="melvin@gmail.com"):
#         user_datastore.create_user(
#             user_name="melvin",email="melvin@gmail.com",password="1234",fs_uniquifer='hesoyam')
#         db.session.commit()


@app.route("/")
def user_login():
    return render_template("file.html")


class User_data(Resource):
    @auth_required('token')
    def get(self):        
        user_data=current_user.user_name
        return user_data

class User_id(Resource):
    @auth_required('token')
    def get(self):
        user_data=current_user.id
        return user_data
    


class List_showAPi(Resource):
    @cache.cached(timeout=20)
    @auth_required('token')
    def get(self):
        # start1 = default_timer()
        user_name=current_user.user_name
        value=User.query.filter(User.user_name==user_name).first()
        if value:    
            user_id=value.id
            list_data=Lists.query.filter(Lists.user_user_id==user_id).all()
            data=list()
            for lists in list_data:
                output={
                    "list_id":lists.list_id,
                    "list_title":lists.list_title,
                    "description":lists.description
                }

                data.append(output)
                output=dict()
            
            # duration = default_timer() - start1
            # print("time taken to list",duration)

            return data,200

        elif value is None:
            return "user not found",404


class List_CardAPI(Resource):
    @cache.cached(timeout=20)
    @auth_required('token')
    def get(self):
        # start1 = default_timer()
        user_name=current_user.user_name
        Value=User.query.filter(User.user_name==user_name).first()
        if Value:
            user_id=Value.id
            list1=Lists.query.filter(Lists.user_user_id==user_id).all()
            Cards1=Cards.query.all()
            data=list()
            for lists in list1:
                for card in Cards1:
                    if lists.list_id == card.list_list_id:
                        output = {
                            "list_id":lists.list_id,
                            "card_id":card.card_id,
                            "card_title":card.card_title,
                            "content":card.content,
                            "deadline":card.deadline,
                            "status":card.status,  
                            "card_list_id":card.list_list_id,
                            "completed_on":card.completed_on   
                        }

                        data.append(output)
                        output=dict()
            
            # duration = default_timer() - start1
            # print(duration)
            return data,200

        elif Value is None:
            return "user not found",404

class ListAPI(Resource):
    @auth_required('token')
    def put(self,list_id):
        print(list_id)
        data=request.get_json()
        query = Lists.query.filter(Lists.list_id==list_id).first()
        if query:
            list_title=data['list_name']
            if list_title=="":
                return "list title is required",400    
            list_description=data['description']
            if list_description == "":
                return "list_description is required",400        
            query.list_title=list_title
            query.description=list_description
            db.session.add(query)
            db.session.commit()
            return 200
        elif query is None:
            return "list not found",404


    @auth_required('token')
    def post(self):
        data=request.get_json()
        list_title=data['list_name']
        if list_title=="":
            return "list title is required",400   
        list_description=data['description']  
        if list_description == "":
            return "list_description is required",400   
        user_name=user_name=current_user.user_name        
        value=User.query.filter(User.user_name==user_name).first()
        if value:
            user_id=value.id
            add=Lists(user_user_id=user_id,list_title=list_title,description=list_description)
            db.session.add(add)
            db.session.commit()
            return 200

        elif value is None:
            return "user not found",404

    @auth_required('token')
    def delete(self,list_id):
        query = Lists.query.filter(Lists.list_id==list_id).first()
        if query:
            card_query=Cards.query.filter(Cards.list_list_id==list_id).delete()
            list_query=Lists.query.filter(Lists.list_id==list_id).delete()
            db.session.commit()            
            return "Successfully Deleted",200

        elif query is None:
            return "list not found",404


class CardAPI(Resource):
    @auth_required('token')
    def post(self,list_id):
        data=request.get_json()
        card_title=data['card_name']
        description=data['description']
        deadline=data['deadline']
        print(deadline)
        status=data['status']
        if card_title == "":
            return "card title required ",400
        
        if description == "":
            return "description required",400
        
        if deadline == "":
            return "deadline required",400

        add=Cards(card_title=card_title,content=description,deadline=deadline,status=status,list_list_id=list_id)
        db.session.add(add)
        db.session.commit()
        return 200

    @auth_required('token')
    def put(self):
        data=request.get_json()
        list_id = data['list_id']
        card_title=data['card_name']
        description=data['description']
        deadline=data['deadlines']
        status=data['status']
        card_id=data['card_id']
        completed_on=""

        if card_title == "":
            return "card title required ",400
        
        if description == "":
            return "description required",400
        
        if deadline == "":
            return "deadline required",400

        if status == True :
            status="COMPLETED"
            import datetime as dp
            completed_on=dp.date.today()
        elif status == "COMPLETED":
            status="COMPLETED"
            import datetime as dp
            completed_on=dp.date.today()
        else:
            status = "YET TO COMPLETE"
        
        query=Cards.query.filter(Cards.card_id==card_id).first()
        query.card_title=card_title
        query.content=description
        query.deadline=deadline
        query.status=status
        query.list_list_id=list_id
        query.completed_on=completed_on
        db.session.commit()
        return 200

    @auth_required('token')
    def delete(self,card_id):
        query=Cards.query.filter(Cards.card_id==card_id).delete()
        if query:
            db.session.commit()          
            return "Successfully Deleted",200
        else:
            return "card not found",400


class SummaryAPI(Resource):
    @auth_required('token')
    def get(self):
        import matplotlib.pyplot as plt
        plt.switch_backend('agg')
        user_name=current_user.user_name
        user_data=User.query.filter(User.user_name==user_name).first()
        user_id_data=user_data.id
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
        return s,200

class ImportAPI(Resource):
    @auth_required('token')
    def get(self):
        user_id = current_user.id
        job = tasks.import_list.delay(user_id)
        result = job.wait()
        if result == "completed":
            path = "{}list.csv".format(user_id)
            return send_file(path, as_attachment=True)
        else:
            return 400

class ImportCardAPI(Resource):
    @auth_required('token')
    def get(self,list_id):
        job = tasks.import_cards.delay(list_id)
        result = job.wait()
        if result == "completed":
            path = "{}card.csv".format(list_id)
            return send_file(path, as_attachment=True)
        else:
            return 400



api.add_resource(User_data,'/user/data')
api.add_resource(ListAPI,"/api/kanban_list/create","/api/kanban_list/edit/<string:list_id>","/api/kanban_list/delete/<string:list_id>")
api.add_resource(List_showAPi,"/api/kanban_board/list")
api.add_resource(List_CardAPI,'/api/kanban_board/list/card')
api.add_resource(CardAPI,'/api/kanban_list/create_card/<string:list_id>','/api/kanban_list/edit_card','/api/kanban_list/card/delete/<string:card_id>')
api.add_resource(SummaryAPI,'/api/kanban_board/summary_page')
api.add_resource(User_id,'/api/kanban_board/id')
api.add_resource(ImportAPI,'/api/import/list')
api.add_resource(ImportCardAPI,'/api/import/card/<string:list_id>')

if __name__=="__main__":
    app.run(debug=True)