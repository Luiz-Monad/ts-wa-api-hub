import { ErrorRequestHandler, Request, RequestHandler } from 'express'
import http from 'http'

export type TypeOfPromise<P> = P extends Promise<infer T> ? T : never

export type ErrHandler = ErrorRequestHandler
export type ReqHandler = RequestHandler

export type ReqType = Request
export type ResType = Response
export type FileType = Request['file']
export type AppType = ReqType['app']
export type ServerType = http.Server
