const Login = Vue.component('login',{
    template: `
    <div>
        <p>
            <h2>KANBAN BOARD</h2>
        </p>
        <div class="container" v-if="success">
            <div class="position-absolute top-50 start-50 translate-middle">
                <form action=''>
                    <div class="mb-3">
                        <label for="login_control" class="form-label">Email</label>
                        <input type="email" class="form-control" id="login_control" aria-describedby="loginhelp" required  placeholder="user name" v-model="formdata.email"/>
                        <label for="pass_control" class="form-label">Password</label>
                        <input type="password" class="form-control" id="pass_control" aria-describedby="loginhelp" required  placeholder="password" v-model="formdata.password"/>
                        <div id="loginhelp" class="form-text">Please enter your user name and  password to login.</div>
                    </div>
                    <button @click.prevent="loginUser" class="btn btn-success" data-bs-toggle="tooltip"  title="click to login">LOGIN</button>

                </form>
            </div>
        </div>
        <div v-else>{{message}}</div>
    </div>
    `,
    data(){
        return{
            formdata: {
                email: '',
                password: '',
            },
            success:true,
            message:"Something went wrong",
        }
    },
    methods: {
        async loginUser(){
            const res = await fetch('/login?include_auth_token',{
                method:'post',
                headers:{
                    'Content-Type':'application/json',
                },
                body:JSON.stringify(this.formdata),
            })
            if(res.ok){
                const data = await res.json()
                localStorage.setItem('auth-token',data.response.user.authentication_token)
                const response_user = await fetch('/user/data' , {
                    headers:{
                        'Content-Type': 'application/json',
                        'Authentication-Token':localStorage.getItem('auth-token'),
                    },
                })
        
                if (response_user.ok){   
                    const userdata = await response_user.json()    
                    localStorage.setItem('user',userdata)
                    this.$router.push('/home')
                }
                else{
                    this.success=false
                }
            }
            else{
                const data = await res.json()  
                this.success=false
                this.message=data.response.errors

            }
        
        },
    },
    mounted(){
        let login = localStorage.getItem('auth-token');
        if(login){
            this.$router.push('/home')
        }
    }
})


const Home = Vue.component('home',{
    template:`<div>
    <div v-if="success">
    <nav class="navbar">
        <div class="container-fluid" style="background-color:rgba(199, 194, 218, 0.63) ;">
            <em>WELCOME  <strong>{{user_name}}</strong></em>
            <div class="d-grid gap-2 d-md-flex justify-content-md-end" id="styling">
                <button class="btn btn-primary" v-on:click="import_list">EXPORT</button>
                <router-link :to="{name:'summary_list',params:{list_info:list_info}}" class="btn btn-primary">SUMMARY</router-link>
                <a class="btn btn-primary" href="" role="button" @click.prevent="test">LOGOUT</a>
            </div>    
        </div>
    </nav><br> 
    <div class="container" v-if="list_info.length > 0">
        <div id="app">
            <div class="row">
                <div class="col-sm-3" v-for="(items, index) in list_info">
                    <div class="card text-center mb-3" style="background-color: rgb(188, 233, 236);">
                        <div class="card-body">
                            <div class="btn-group">
                                <button class="btn btn dropdown-toggle mb-3" style="background-color: #330ebb56;" type="button" data-bs-toggle="dropdown">{{items.list_title}}</button>
                                <ul class="dropdown-menu">
                                    <li> <router-link :to="{name:'edit_list',params:{id:items.list_id,list_data:items}}" class="dropdown-item">Edit</router-link></li>
                                    <li><a class="dropdown-item" href="" role="button" @click.prevent="delete_list(items.list_id,index)">DELETE</a></li>
                                </ul>
                            </div><br>
                            <div v-for="(card, index) in card_info">
                                <div v-if="items.list_id == card.card_list_id">
                                    <div class="card text-center  mb-3" v-if="card.status == 'COMPLETED'" style="background-color: #00AC61;">
                                        <div class="card-body">                                                    
                                            <div class="dropdown">
                                                <button class="btn dropdown-toggle" style="background-color:#d51be696 ;" type="button" data-bs-toggle="dropdown">
                                                    <h6 class="card-title">{{card.card_title}}</h6>
                                                </button>
                                                <ul class="dropdown-menu">
                                                    <li><router-link :to="{name:'edit_card',params:{name:items,list_data:list_info,card_data:card}}" class="dropdown-item"> EDIT</router-link></li>
                                                    <li><a class="dropdown-item" href="" role="button" @click.prevent="delete_card(card.card_id,index)">DELETE</a></li>
                                                </ul>
                                            </div><br>
                                            <p class="card-text">{{card.content}}</p>
                                            <p class="card-text">deadline : {{card.deadline}}</p>
                                            <p class="card-text">{{card.status}}</p>
                                            <p class="card-text">completed on : {{card.completed_on}}</p>
                                        </div>
                                    </div>
                                    <div class="card text-center  mb-3" v-else-if="card.status == 'DEADLINE PASSED'" style="background-color: rgba(255,6,6,0.651);">
                                        <div class="card-body">                                                    
                                            <div class="dropdown">
                                                <button class="btn dropdown-toggle" style="background-color:#d51be696 ;" type="button" data-bs-toggle="dropdown">
                                                    <h6 class="card-title">{{card.card_title}}</h6>
                                                </button>
                                                <ul class="dropdown-menu">
                                                    <li><a class="dropdown-item" href="#" onclick="alert('DEADLINE PASSED ! unable to edit the card')">EDIT</a></li>
                                                    <li><a class="dropdown-item" href="" role="button" @click.prevent="delete_card(card.card_id,index)">DELETE</a></li>
                                                </ul>
                                            </div><br>
                                            <p class="card-text">{{card.content}}</p>
                                            <p class="card-text">{{card.deadline}}</p>
                                            <p class="card-text">{{card.status}}</p>
                                            <p class="card-text">{{card.completed_on}}</p>
                                        </div>
                                    </div>
                                    <div v-else class="card text-center mb-3" style="background-color:#eb9bd97a ;">
                                        <div class="card-body">                                                    
                                            <div class="dropdown">
                                                <button class="btn dropdown-toggle" style="background-color:#d51be696 ;" type="button" data-bs-toggle="dropdown">
                                                    <h6 class="card-title">{{card.card_title}}</h6>
                                                </button>
                                                <ul class="dropdown-menu">
                                                    <li><router-link :to="{name:'edit_card',params:{name:items,list_data:list_info,card_data:card}}" class="dropdown-item"> EDIT</router-link></li>
                                                    <li><a class="dropdown-item" href="" role="button" @click.prevent="delete_card(card.card_id,index)">DELETE</a></li>
                                                </ul>
                                            </div><br>
                                            <p class="card-text">{{card.content}}</p>
                                            <p class="card-text">{{card.deadline}}</p>
                                            <p class="card-text">{{card.status}}</p>
                                            <p class="card-text">{{card.completed_on}}</p>
                                        </div>
                                    </div> 

                                </div>
                            </div>
                            <router-link :to="{name:'create_card',params:{id:items.list_id,name:items.list_title}}"><i class="bi bi-plus-square-fill" style="font-size:30px;"></i></router-link><br>
                            <button class="btn btn-primary" @click.prevent="import_card(items.list_id)">EXPORT</button>
                        </div>
                    </div>
                </div>
                <div class="col-sm-3">
                    <div class="card text-center mb3" style="background-color: rgb(188, 233, 236);">
                        <div class="card-body">
                        <router-link to='/create/list'><i class="bi bi-plus-square-fill" style="font-size:60px;"></i></router-link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="container" v-else >
        <div class="position-absolute top-50 start-50 translate-middle">
            <p>
                <h3>There are no list in the board.</h3>
            </p>
            <p>
                <router-link to='/create/list'><i class="bi bi-plus-square-fill" style="font-size:60px;"></i>&nbsp;ADD A LIST</router-link>
            </p>
        </div>
    </div>
    </div>
    <div v-else>{{error}}.</div>
    </div>`,
    data(){
        return{
                list_info: '',
                card_info: '',
                success: true,
                error : 'Something went wrong',
                user_name:localStorage.getItem('user'),
                Token:localStorage.getItem('auth-token')
            }

        },
        methods:{
            async import_list(){
                const res = await fetch('/api/import/list',{
                    headers:{
                        'Content-Type': 'application/json',
                        'Authentication-Token':localStorage.getItem('auth-token'),
                    },
                
                }).then( res => res.blob() )
                .then( blob => {
                    var file = window.URL.createObjectURL(blob);
                    window.location.assign(file);
                })

            },
            async import_card(list_id){
                const query_to_import = await fetch(`/api/import/card/${list_id}`,{
                    headers:{
                        'Content-Type': 'application/json',
                        'Authentication-Token':localStorage.getItem('auth-token'),
                    },
                
                }).then( res => res.blob() )
                .then( blob => {
                    var file = window.URL.createObjectURL(blob);
                    window.location.assign(file);
                })

            },
            test(){
                this.$root.logout()
            },
            async delete_list(list_id,index){
                if (window.confirm("Deleting the list will delete all the cards ?")) {
                const res_of_delete = await fetch(`/api/kanban_list/delete/${list_id}`,{
                    method:'delete',
                    headers:{
                        'Content-Type': 'application/json',
                        'Authentication-Token':localStorage.getItem('auth-token'),
                    },
                })

                if (res_of_delete.ok){
                    alert('Sucessfully Deleted');
                    this.list_info.splice(index, 1);
                }
                else{
                    this.error='Unable to delete'
                }
            }

            },
            async delete_card(card_id,index){
                const res_of_delete = await fetch(`/api/kanban_list/card/delete/${card_id}`,{
                    method:'delete',
                    headers:{
                        'Content-Type': 'application/json',
                        'Authentication-Token':localStorage.getItem('auth-token'),
                    },
                })

                if (res_of_delete.ok){
                    alert('Sucessfully Deleted');
                    this.card_info.splice(index, 1);
                }
                else{
                    this.error='Unable to delete'
                }
                
            },
        },
    async mounted() {
        const res = await fetch('/api/kanban_board/list' , {
            headers:{
                'Content-Type': 'application/json',
                'Authentication-Token':localStorage.getItem('auth-token'),
            },
        })

        if (res.ok){   
            const data = await res.json()        
            this.list_info=data;
            const resp =await fetch("/api/kanban_board/list/card",{
                headers:{
                    'Content-Type':'application/json',
                    'Authentication-Token':localStorage.getItem('auth-token'),
                },
            })
            if (resp.ok){
                const datas = await resp.json()
                this.card_info=datas;
            }
        }
         else if (res.status == 401) {
            this.success=false
            this.error="Please login to continue."
        } else {
            const data = await res.json()
            this.success= false
            this.error = data
        } 
    },
})

const Edit_list = Vue.component('edit_list',{
    template:`<div>
    <div class="container" v-if="success_list">
        <div class="position-absolute top-50 start-50 translate-middle">
            <p>
                <h4>
                    <center>EDIT A LIST</center>
                </h4>
                <form action="">
                    <div class="mb-3">
                        <label for="list_name" class="form-label" >NAME</label>
                        <input type="text" class="form-control" id="list_name" name="list_name" v-model="form_data.list_name" placeholder="list name" required/>
                    </div>
                    <div class="mb-3">
                        <label for="description" class="form-label">DESCRIPTION</label>
                        <textarea class="form-control" id="description" rows="4" cols="50" name="list_description" autofocus v-model="form_data.description" placeholder="description" required></textarea>
                    </div>
                    <button @click.prevent="EditList" class="btn btn-success" data-bs-toggle="tooltip" data-bs-placement="left" title="click to create new list" >SAVE</button>
                    <router-link to='/home'><button class="btn btn-primary" data-bs-toggle="tooltip" data-bs-placement="left" title="click to go to home page">HOME</button></router-link>
                </form>
            </p>
        </div>
    </div>
    <div v-else>{{error_list}}. click <router-link to="/home">here</router-link> to go back to home </div>
    </div>`,
    props:['list_data','id'],
    data(){
        return{
            form_data: {
                list_name: this.list_data.list_title,
                description: this.list_data.description,
            },
            success_list: true,
            error_list:"Something went wrong",
        }
    },    
    methods: {
        async EditList(){
            const res = await fetch(`/api/kanban_list/edit/${this.$route.params.id}`,{
                method:'put',
                headers:{
                    'Content-Type':'application/json',
                    'Authentication-Token':localStorage.getItem('auth-token'),

                },
                body:JSON.stringify(this.form_data),
            })
            if(res.ok){
                alert("List edited successfully")
                this.$router.push('/home')
            }
            else{
                const data = await res.json() 
                this.success_list=false
                this.error_list=data
            }
        },
    },
})


const Create_list = Vue.component('create',{
    template:`<div>
    <div class="container" v-if="success_list">
        <div class="position-absolute top-50 start-50 translate-middle">
            <p>
                <h4>
                    <center>ADD A LIST</center>
                </h4>
                <form action="">
                    <div class="mb-3">
                        <label for="list_name" class="form-label" >NAME</label>
                        <input type="text" class="form-control" id="list_name" name="list_name" v-model="form_data.list_name" placeholder="list name" required/>
                    </div>
                    <div class="mb-3">
                        <label for="description" class="form-label">DESCRIPTION</label>
                        <textarea class="form-control" id="description" rows="4" cols="50" name="list_description" autofocus v-model="form_data.description" placeholder="description" required></textarea>
                    </div>
                    <button @click.prevent="CreateList" class="btn btn-success" data-bs-toggle="tooltip" data-bs-placement="left" title="click to create new list" >SAVE</button>&nbsp;&nbsp;
                    <router-link to='/home'><button class="btn btn-primary" data-bs-toggle="tooltip" data-bs-placement="left" title="click to go to home page">HOME</button></router-link>
                </form>
            </p>
        </div>
    </div>
    <div v-else>{{error_list}}. click <router-link to="/home">here</router-link> to go back to home</div>
    </div>`,
    data(){
        return{
            form_data: {
                list_name: '',
                description: '',
            },
            success_list: true,
            error_list:"Something went wrong"
        }
    },
    methods: {
        async CreateList(){
            const res = await fetch('/api/kanban_list/create',{
                method:'post',
                headers:{
                    'Content-Type':'application/json',
                    'Authentication-Token':localStorage.getItem('auth-token'),

                },
                body:JSON.stringify(this.form_data),
            })
            console.log(res)
            if(res.ok){
                alert("List created successfully")
                this.$router.push('/home')
            }
            else{
                const data = await res.json() 
                console.log(data)
                this.success_list=false
                this.error_list=data
            }
        },
    },


})


const Create_card = Vue.component('create_card',{
    template:`<div>
    <div class="container" v-if="success_list">
        <div class="position-absolute top-50 start-50 translate-middle">
            <p>
                <h4>
                    <center>CREATE A CARD</center><br>
                </h4>
                <form action="">
                    <div class="mb-3">
                        <label for="list_name" class="form-label">LIST</label>
                        <input type="text" id="list_name" :placeholder="name" disabled  />
                                               
                    </div>
                    <div class="mb-3">
                        <label for="card_name" class="form-label" >TITLE</label>
                        <input type="text" class="form-control" id="card_name" name="card__name" v-model="card_data.card_name" placeholder="card name" required>
                    </div>
                    <div class="mb-3">
                        <label for="content" class="form-label">CONTENT</label>
                        <textarea class="form-control" id="content" rows="4" cols="50" name="content" v-model="card_data.description" placeholder="card description" required></textarea>
                    </div>
                    <div class="mb-3">
                        <label for="deadline" class="form-label">DEADLINE</label>
                        <input type="date" name="date" v-model="card_data.deadline" required>   
                    </div>
                    <div class="form-check form-switch form-check-reverse">
                        <input name="status" class="form-check-input" type="checkbox" id="flexSwitchCheckReverse" disabled >
                        <label class="form-check-label" for="flexSwitchCheckReverse">MARK AS COMPLETE</label>
                    </div>                   
                    <button @click.prevent="CreateCard" class="btn btn-success" data-bs-toggle="tooltip" data-bs-placement="left" title="click to create new card">SAVE</button> &nbsp; &nbsp;
                    <router-link to='/home'><button class="btn btn-primary" data-bs-toggle="tooltip" data-bs-placement="left" title="click to go to home page">HOME</button></router-link>
                </form>
            </p>
        </div>
    </div>
    <div v-else>{{error_list}}. click <router-link to="/home">here</router-link> to go back to home</div>
    </div>`,
    props: {
        name: {
          type: String,
          default: '',
        },
      },
    data(){
        return{
            card_data:{
                card_name:'',
                description:'',
                deadline:'',
                status:'YET TO COMPLETE'
            },
            success_list: true,
            error_list:"Something went wrong",
        }
    },
    methods: {
        async CreateCard(){
            const res = await fetch(`/api/kanban_list/create_card/${this.$route.params.id}`,{
                method:'post',
                headers:{
                    'Content-Type':'application/json',
                    'Authentication-Token':localStorage.getItem('auth-token'),

                },
                body:JSON.stringify(this.card_data),
            })
            if(res.ok){
                alert("Card created successfully")
                this.$router.push('/home')
            }
            else{
                const data = await res.json()
                this.success_list=false
                this.error_list=data
            }
        },
    },

})


const Edit_card = Vue.component('edit_card',{
    template:`<div>
    <div class="container" v-if="success_list">
        <div class="position-absolute top-50 start-50 translate-middle">
            <p>
                <h4>
                    <center>EDIT A CARD</center>
                </h4>
                <form action="">
                    <div class="mb-3">
                        <label for="list_name" class="form-label">LIST</label>
                        
                        <select name="list_name" id="list_name" class="form-select" aria-label="Default select example"  v-model="form_data.list_id">
                            <button class="btn btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown"></button>
                            <option v-for="lists in list_data" :value="lists.list_id">{{lists.list_title}}</option>  
                            <option selected>{{name.list_title}}</option>
                                         
                        </select>
                                               
                    </div>
                    <div class="mb-3">
                        <label for="card_name" class="form-label">CARD TITLE</label>
                        <input type="text" class="form-control" id="card_name" name="card__name" v-model="form_data.card_name" required />
                    </div>
                    <div class="mb-3">
                        <label for="content" class="form-label">CONTENT</label>
                        <textarea class="form-control" id="content" rows="4" cols="50" name="content" v-model="form_data.description"  required></textarea>
                    </div>
                    <div class="mb-3">
                        <label for="deadline" class="form-label">DEADLINE</label>
                        <input type="date" name="date" v-model="form_data.deadlines" required />   
                    </div>
                    <div v-if="card_status == 'COMPLETED'"  class="form-check form-switch form-check-reverse" >
                        <input name="status" class="form-check-input" type="checkbox" id="flexSwitchCheckReverse"  v-model="form_data.status"  checked>
                        <label class="form-check-label" for="flexSwitchCheckReverse">MARK AS COMPLETE</label>
                    </div>  
                
                    <div v-else class="form-check form-switch form-check-reverse" >
                        <input name="status" class="form-check-input" type="checkbox" id="flexSwitchCheckReverse" v-model="form_data.status" >
                        <label class="form-check-label" for="flexSwitchCheckReverse">MARK AS COMPLETE</label>
                    </div>
                
                    <button @click.prevent="EditCard" class="btn btn-success" data-bs-toggle="tooltip" data-bs-placement="left" title="click to create new list">SAVE</button>&nbsp;&nbsp;
                    <router-link to='/home'><button class="btn btn-primary" data-bs-toggle="tooltip" data-bs-placement="left" title="click to go to home page">HOME</button></router-link>
                </form>
            </p>
        </div>
    </div>
    <div v-else>{{error_list}}. click <router-link to="/home">here</router-link> to go back to home</div>
    </div>`,
    props:['name','list_data','card_data'],
    data(){
        return{
            form_data:{
                list_id:this.card_data.list_id,
                card_name: this.card_data.card_title,
                description:this.card_data.content,
                deadlines:this.card_data.deadline,
                status:'',
                card_id:this.card_data.card_id,
            },
            success_list: true,
            error_list:"Something went wrong",
            card_status:this.card_data.status,
        }
    },
    methods: {
        async EditCard(){
            const res = await fetch("/api/kanban_list/edit_card",{
                method:'put',
                headers:{
                    'Content-Type':'application/json',
                    'Authentication-Token':localStorage.getItem('auth-token'),

                },
                body:JSON.stringify(this.form_data),
            })
            if(res.ok){
                alert("Card edited successfully")
                this.$router.push('/home')
            }
            else{
                const data = await res.json()
                this.success_list=false
                this.error_list=data
            }
        },

    },
})

const Summary_list = Vue.component("summary_list",{
    template:`<div>
    <div v-if="success">
    <nav class="navbar">
    <div class="container-fluid" style="background-color:rgba(199, 194, 218, 0.63) ;">
        <em>WELCOME <strong> {{user_name}}</strong></em>
        <div class="d-grid gap-2 d-md-flex justify-content-md-end" id="styling">
            <router-link to="/home" class="btn btn-primary">HOME</router-link>
            <a class="btn btn-primary" href="" role="button" @click.prevent="test">LOGOUT</a>
        </div>    
    </div>
    </nav><br>
    <div class="container"> 
        <div class="row">
            <div class="col-sm-6" v-for="data in list_info">
                <div class="card text-center mb-3" style="background-color: rgb(247, 215, 244);">
                    <div class="card-body">
                        <div class="btn-group">
                            <button class="btn btn-lg mb-3" style="background-color:rgba(228, 48, 153, 0.815) ;" type="button">{{data.list_title}}</button>
                        </div><br>
                        <div v-for="(value,index) in summary">
                            <div v-if="data.list_id == index">
                                <div v-if="summary[index]['complete'] > 0 ">
                                    <img :src="'static/'+user_id+'_'+data.list_id+'.png'" class="card-img-top" />
                                </div>
                                COMPLETED : {{summary[index]['complete']}}<br>
                                YET TO COMPLETE : {{summary[index]['yet_to_complete']}}<br>
                                DEADLINE PASSED : {{summary[index]['deadline_passed']}}<br>
                            </div>
                        </div> 
                    </div>
                </div>
            </div>
        </div>
    </div>        
    </div>
    <div v-else>{{error}}. click <router-link to="/home">here</router-link> to go back to home</div>
    </div>`,
    props:['list_info'],
    data(){
        return{
            success:true,
            error:"Something went wrong",
            summary:"",
            user_id:'',
            user_name:localStorage.getItem('user')
        }
    },
    methods:{
        test(){
            this.$root.logout()
        }
    },
    async mounted() {
        const res = await fetch('/api/kanban_board/summary_page' , {
            headers:{
                'Content-Type': 'application/json',
                'Authentication-Token':localStorage.getItem('auth-token'),
            },
        })

        if (res.ok){   
            const data = await res.json()        
            this.summary=data;
        }
        else{
            this.success=false
            this.error=data.response.error

        }
        const response_data = await fetch('/api/kanban_board/id' , {
            headers:{
                'Content-Type': 'application/json',
                'Authentication-Token':localStorage.getItem('auth-token'),
            },
        })
        if (response_data.ok){
            const data_id = await response_data.json()
            this.user_id  = data_id
        }
        else{
            const data = await response_data.json() 
            this.success=false
            this.error=data
        }

    },

})

const routes = [
    { path: '/login',component: Login, name: "login"},
    { path: '/home',component: Home, name: "home"},
    { path: '/create/list',component:Create_list,name:"create"},
    {path: '/edit/list/:id',component:Edit_list,name:"edit_list",props:true},
    {path:'/create/card/:id',component:Create_card,name:"create_card",props:true},
    {path:'/edit/card',component:Edit_card,name:"edit_card",props:true},
    {path:'/summary',component:Summary_list,name:"summary_list",props:true},
];

const router = new VueRouter({
    routes,
    base: '/login',
})

const app= new Vue({
    el:"#app",
    router : router, 
    methods:{
        async logout(){
            if (window.confirm("Do you really want to logout ?")) {
            const res = await fetch('/logout')
            if(res.ok){
                localStorage.clear()
                this.$router.push('/login')
            }
            else{
                console.log("cannot logout")
            }
            }
        }
    },
          
})