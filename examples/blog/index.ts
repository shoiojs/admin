import Shoio from '@shoio/core'
import { ShoioHttpServer } from '@shoio/server'
import { AdminPlugin, Admin, Edit, Table } from '../../index'

class Blogs extends Shoio {
    

    posts = [
        {
            id: '9a3a5870-a14f-4004-872e-0deb675eaf14',
            title: 'Olá mundo!',
            content: "<b>hello</b>"
        },
        {
            id: '9a3a5870-a14f-4004-872e-0deb675eaf24',
            title: 'Olá mundo!',
            content: "<b>hello</b>"
        },
        {
            id: '9a3a5870-a14f-4004-872e-0deb675eaf34',
            title: 'Olá mundo!',
            content: "<b>hello</b>"
        },
        {
            id: '9a3a5870-a14f-4004-872e-0deb675eaf44',
            title: 'Olá mundo!',
            content: "<b>hello</b>"
        }
    ]

    mountRouter(http) {
    }

    mountAdmin( admin: Admin ) {

        admin.actions.register({
            id: '_login',
            action: (user) => {
                // This could be async!
                if( user.password === '123456' && user.email === 'brendon@brendon.com' ) {
                    // If its all ok, return the data to sign with jsonwebtoken
                    return {
                        name: 'hello world'
                    }
                }
            }
        })

        admin.actions.register({
            id: 'approve',
            action: (user) => {
                return {
                    message: 'ok'
                }
            }
        })

        admin.pages.add( new Table({
            pageName: 'posts-list',
            fetchList: (page, limit) => this.listPosts(page),
            delete: (id) => this.delete(id),
            itemButtons: [
                {
                    label: 'Aprovar',
                    icon: 'check',
                    action: {
                        id: 'approve',
                    }
                },
                {
                    label: '',
                    icon: 'edit',
                    action: {
                        id: 'redirect',
                        payload: [ 'post' ]
                    }
                },

                {
                    icon: 'delete',
                    label: '',
                    action: {
                        id: 'delete',
                    }
                }
            ]
        }) )

        admin.pages.add( new Edit({
            pageName: 'post',
            fields: {
                'title': new Edit.Field('text', 'Título'),
                'content': new Edit.Field('html', 'Conteúdo')
            },
            fetch: (id) => this.fetchPost(id),
            update: (id, data) => {
                console.log(id, data)
                return this.updatePost(id, data)
            }
        }) )

        // admin.pages.add( new Edit({
        //     pageName: 'post',
        //     fields: {
        //         'title': true,
        //         'content': 'text'
        //     },
        //     fetch: (id) => this.fetchPost(id),
        //     update: (id, data) => {
        //         console.log(id, data)
        //         return this.updatePost(id, data)
        //     }
        // }) )

        const cron =  {
            cronResetProgram: '1 * * * *',
            active: true
        }


        admin.actions.register({
            id: '_reboot_now',
            action: () => {
                console.log('REBOOTING MA MACHINE')
            }
        })

        admin.pages.add( new Edit({
            pageName: 'edit-config',
            fields: {
                'cronResetProgram': new Edit.Field('text', 'Configuração CRON'),
                'active':  new Edit.Field('switch', 'Ativo'),
                'reboot': new Edit.Field('button', {
                    icon: 'reboot',
                    label: 'Reiniciar agora',
                    action: {
                        id: '_reboot_now'
                    }
                })
            },
            fetch: () => {
                return cron
            },
            update: (id, data) => {
                return Object.assign(cron, data)
            }
        }) )

        admin.tabs.add({ 
            title: "Posts", 
            page: 'posts-list'
        })

        admin.tabs.add({ 
            title: "Reboot Program", 
            page: 'edit-config'
        })
    }

    listPosts( page ) {
        return this.posts
    }

    fetchPost(id) {
        return this.posts.find( i => i.id === id) 
    }


    updatePost(id, data) {
        const index = this.posts.findIndex( i => i.id === id) 
        this.posts[index] = {
            ...this.posts[index],
            ...data
        }
        return this.posts[index]
    }

    delete(id) {
        const index = this.posts.findIndex( i => i.id === id) 
        this.posts.splice(index, 1)
        return true

    }

}

const blog = new Blogs({
    plugins: [
        new ShoioHttpServer({port: 3000, boot: true}),
        new AdminPlugin({path: '/admin'}),
    ]
})

blog.mount()