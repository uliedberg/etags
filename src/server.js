const http = require('http');
const Koa = require('koa');
const serve = require('koa-static');
const bunyan = require('bunyan');
const koaLogger = require('./koalogger.js'); //require('koa-bunyan');
const uuidv4 = require('uuid/v4');

const app = new Koa();
const logger = bunyan.createLogger({name: "etags"});

app.use(koaLogger(logger, { level: 'info' }));

// TODO: clean up :)
app.use(async (ctx, next) => {
  if (ctx.url.startsWith('/child/etagged/')) {
    const reqEtag = ctx.request.headers['if-none-match'];
    if (reqEtag) {
      ctx.status = 304;
      ctx.body = null;
      logger.info({ url: ctx.url, req: ctx.request, res: ctx.response }, 'etag present in req');
      return;
    }
    ctx.etag = uuidv4();
    await next();
    logger.info({ url: ctx.url, req: ctx.request, res: ctx.response }, 'etag set');
  } else {
    await next();
  }
});


app.use(serve('./public'));

const server = http.createServer(app.callback());

server.listen(3000, () => {
  logger.info({ address: server.address() }, 'server started');
});
