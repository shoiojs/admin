

import { randomBytes } from 'crypto';
import { ShoioHttpServer } from '@shoio/server'
import * as jwt from 'jsonwebtoken'

export class Actions {
    actions = []

    static INSTANCE = null

    register(action) {
        this.actions.push(action)
        return action
    }

    findById(id) {
        return this.actions.find( action => action.id === id)
    }

    getItems() {
        return this.actions
    }

    static getInstance() : Actions {
        if( !Actions.INSTANCE ) {
            return Actions.INSTANCE = new Actions()
        }
        return Actions.INSTANCE
    }

}


export class Page {
    constructor( config ) {
    }
}

export class Field {
    label: any;
    type: any;
    config = {}
    action: any;

    constructor( type, config ) {
        this.type = type
        if( typeof config === 'string' ) {
            this.label = config
        }
        if( typeof config === 'object' ) {
            this.label = config.label
            this.action = config.action
            this.config = config.config
        }
    }
}

export class Table extends Page {
    
    type = 'table'
    name = ''
    itemButtons: any[];
    
    constructor({pageName, fields = [], fetchList, delete: deleteAction = (void 0), itemButtons = []}) {
    
        super(arguments[0])
    
        this.name = pageName
        this.itemButtons = itemButtons

        Actions.getInstance().register({
            id: randomBytes(42).toString('hex'),
            action: fetchList,
            name: 'fetch-list',
            pageName
        })


        Actions.getInstance().register({
            id: randomBytes(42).toString('hex'),
            action: deleteAction,
            name: 'delete',
            pageName
        })
    
    }
}

export class Edit extends Page{
    
    type = 'edit'
    name = ''
    fields: any;

    static Field = Field

    constructor({pageName, fields = null, fetch, update}) {

        super(arguments[0])
        
        this.name = pageName

        this.fields = fields

        Actions.getInstance().register({
            id: randomBytes(42).toString('hex'),
            action: fetch,
            name: 'fetch',
            pageName
        })
        
        Actions.getInstance().register({
            id: randomBytes(42).toString('hex'),
            action: update,
            name: 'update',
            pageName
        })
    }
}

export class CRUD {
    static Table= Table
    static Edit= Edit

    constructor() {
        
    }
}

export class Tabs {

    items = []

    add( definition ) {
        this.items.push(definition)
    }

    getItems() {
        return this.items
    }
}

export class Pages {
    items = []
    add( definition ) {
        this.items.push(definition)
    }

    getItems() {
        return this.items
    }
}


export class Admin {
    tabs: Tabs;
    pages: Pages;
    actions = Actions.getInstance()
    router: any;
    prefix: any;
    constructor(config) {
        this.prefix = config.prefix || '/admin'
        this.tabs = new Tabs()
        this.pages = new Pages()
    }

    onAction(id, payload) {
        const actionDefinition = this.actions.findById(id)

        if( !actionDefinition ) {
            throw new Error('Action not found')
        }

        return actionDefinition.action(...payload)
    }

    setRouter(router) {

        this.router = router
        


        router.$router.post(this.prefix + '/auth/token', async (ctx) => {
            const {email, password} = ctx.request.body

            const user = await this.onAction('_login', {email, password})
            
            if( user ) {
                delete user.passwordHash;
                delete user.passwordSalt;
                ctx.body = {
                    authorization: jwt.sign( user, process.env.JWT_SECRET || 'shhhh' )
                }
                return
            }

            ctx.body = {message: 'Wrong credentials'}
            ctx.status = 403

            return


        })

        router.$router.all(this.prefix + '/*', async (ctx, next) => {

            console.log(ctx.originalUrl.indexOf('/auth/token'))

            if( ctx.originalUrl.indexOf('/auth/token') > 0 ) {
                return next()
            }

            try {
                const authorization = ctx.headers.authorization 
                const [undefined, token] = authorization.split(' ')
                jwt.verify(token, process.env.JWT_SECRET || 'shhhh')
                next()
            } catch(e) {
                ctx.body = { message: 'Not authored' }
                ctx.status = 403
            }
        })

        router.$router.post(this.prefix + '/action/:id', async (ctx) => {
            
            const {id} = ctx.params
            const {body: payload} = ctx.request
            
            ctx.body = await this.onAction( id, payload ) 
        
        })

        router.$router.get(this.prefix + '/definitions', async (ctx) => {
                        
            const tabs = this.tabs.getItems()
            const pages = this.pages.getItems()
            const actions= this.actions.getItems()

            ctx.body = {
                tabs,
                pages,
                actions
            }

        })
        
    }
}


export class AdminPlugin {

    static CRUD = CRUD

    admin: Admin;

    installed = false;

    constructor(config) {
        this.admin = new Admin(config)
    }

    async install(shoio) {

        
        if( !this.installed ) {
            const serverPlugin = shoio.$plugins.find(i => i instanceof ShoioHttpServer)
            // await shoio.installPlugin( new ShoioHttpServer() )
        }

        this.installed = true

        shoio.on('created', async (instance) => {
            if( instance.$router && !this.admin.router ) {
                this.admin.setRouter( instance.$router )
            }
            if( typeof instance.mountAdmin === 'function') {
                await instance.mountAdmin(this.admin)
            }
        })
    }
}
