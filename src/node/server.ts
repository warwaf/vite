import http, { Server } from 'http'
import Koa from 'koa'
import chokidar, { FSWatcher } from 'chokidar'
import { Resolver, createResolver, InternalResolver } from './resolver'
import { modulesPlugin } from './serverPluginModules'
import { vuePlugin } from './serverPluginVue'
import { hmrPlugin } from './serverPluginHmr'
import { servePlugin } from './serverPluginServe'

export { Resolver }

export type Plugin = (ctx: PluginContext) => void

export interface PluginContext {
  root: string
  app: Koa
  server: Server
  watcher: FSWatcher
  resolver: InternalResolver
}

export interface ServerConfig {
  root?: string
  plugins?: Plugin[]
  resolvers?: Resolver[]
}

const internalPlugins: Plugin[] = [
  modulesPlugin,
  vuePlugin,
  hmrPlugin,
  servePlugin
]

export function createServer(config: ServerConfig = {}): Server {
  const { root = process.cwd(), plugins = [], resolvers = [] } = config
  const app = new Koa()
  const server = http.createServer(app.callback())
  const watcher = chokidar.watch(root, {
    ignored: [/node_modules/]
  })
  const resolver = createResolver(root, resolvers)

  ;[...plugins, ...internalPlugins].forEach((m) =>
    m({
      root,
      app,
      server,
      watcher,
      resolver
    })
  )

  return server
}
