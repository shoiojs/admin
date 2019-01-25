import Shoio from '@shoio/core'
import { ShoioHttpServer } from '@shoio/server'
import { AdminPlugin, Admin } from '../../index'

class Books extends Shoio {
    
    cacheUsers = [
        {
            id: '9a3a5870-a14f-4004-872e-0deb675eaf14',
            name: 'Brendon Ferreira de Matos'
        },
        {
            id: '9aa3asdasda5870-a14f-4004-872e-0deb675eaf14',
            name: 'Matos Ferreira de Brendon'
        }
    ]

    cacheBooks = [
        {
            id: '9a3a5870-a14f-4004-872e-0deb675eaf14',
            name: 'MA BOOK'
        }
    ]

    mountRouter(http) {
    }

    mountAdmin( admin: Admin ) {

        admin.pages.add( new AdminPlugin.CRUD.Table({
            pageName: 'users-list',
            fetchList: (page, limit) => this.listUsers(page),
        }))

        admin.pages.add( new AdminPlugin.CRUD.Table({
            pageName: 'books-list',
            fetchList: (page, limit) => this.listBooks(page),
        }))

        admin.pages.add( new AdminPlugin.CRUD.Edit({
            pageName: 'user',
            fields: ['*'],
            fetch: (id) => this.fetchUser(id),
            update: (id, data) => this.updateUser(id, data),
        }))

        admin.tabs.add({ 
            title: "Users", 
            page: 'users-list'
        })

        admin.tabs.add({ 
            title: "Books", 
            page: 'books-list'
        })

    }

    serverUp(server) {
        console.log(server)
    }

    listUsers( page ) {
        return this.cacheUsers
    }

    listBooks( page ) {
        return this.cacheBooks
    }

}

const booksWithAdmin = new Books({
    plugins: [
        new ShoioHttpServer({port: 3000, boot: true}),
        new AdminPlugin({path: '/admin'}),
    ]
})

booksWithAdmin.mount()



