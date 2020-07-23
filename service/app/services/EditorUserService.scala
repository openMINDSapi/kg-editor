/*
 *   Copyright (c) 2018, EPFL/Human Brain Project PCO
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */

package services

import java.util.concurrent.ConcurrentHashMap

import akka.actor.{ActorSystem, Cancellable}
import akka.http.scaladsl.model.DateTime
import cats.syntax.either._
import cats.syntax.option._
import com.google.inject.Inject
import constants.EditorConstants
import models.AccessToken
import models.errors.APIEditorError
import models.instance.{NexusInstance, NexusInstanceReference}
import models.specification.QuerySpec
import models.user.{EditorUser, IDMUser}
import monix.eval.Task
import monix.execution.Scheduler.Implicits.global
import play.api.Logger
import play.api.cache.{AsyncCacheApi, NamedCache}
import play.api.http.HeaderNames._
import play.api.http.Status._
import play.api.libs.json.{JsObject, Json}
import play.api.libs.ws.WSClient
import services.query.{QueryApiParameter, QueryService}

import scala.concurrent.duration._

object UserRequestMap {
  private val m = new ConcurrentHashMap[String, (DateTime, Task[Either[APIEditorError, EditorUser]])]

  def put(key: String, value: Task[Either[APIEditorError, EditorUser]]): Task[Either[APIEditorError, EditorUser]] =
    this.m.put(key, (DateTime.now, value))._2

  def get(key: String): Option[Task[Either[APIEditorError, EditorUser]]] = {
    val f = this.m.get(key)
    if (f != null) f._2.some else None
  }

  def cleanMap: Unit =
    this.m.values().removeIf(p => p._1 <= DateTime.now.minus(600000L))

}

class EditorUserService @Inject()(
  config: ConfigurationServiceLive,
  wSClient: WSClient,
  @NamedCache("editor-userinfo-cache") cache: AsyncCacheApi
)(actorSystem: ActorSystem) {
  val logger = Logger(this.getClass)

  object cacheService extends CacheService

  object queryService extends QueryService

//  lazy val scheduler = scheduled
//
//  def scheduled(implicit actorSystem: ActorSystem): Cancellable =
//    actorSystem.scheduler.schedule(initialDelay = 10.seconds, interval = 20.minute) {
//      UserRequestMap.cleanMap
//    }

  def getUserProfile(token: AccessToken): Task[Either[APIEditorError, JsObject]] = {
    val q = wSClient
      .url(s"${config.kgCoreEndpoint}/${config.kgCoreApiVersion}/users/me")
      .withHttpHeaders(AUTHORIZATION -> token.token)
    val r = Task.deferFuture(q.get())
    r.map { res =>
      res.status match {
        case OK => Right(res.json.as[JsObject])
        case _  => Left(APIEditorError(res.status, res.body))
      }
    }
  }

  def getUser(user: IDMUser, token: AccessToken): Task[Either[APIEditorError, Option[EditorUser]]] =
    cacheService.get[EditorUser](cache, user.id).flatMap {
      case None =>
        queryService
          .getInstances(
            wSClient,
            config.kgQueryEndpoint,
            EditorConstants.editorUserPath,
            QuerySpec(Json.obj(), Some("kguser")),
            token,
            QueryApiParameter(vocab = Some(EditorConstants.editorVocab)),
            Map("userId" -> user.id)
          )
          .map { res =>
            res.status match {
              case OK =>
                val users = (res.json \ "results")
                  .as[List[JsObject]]
                if (users.size > 1) {
                  val msg = s"Multiple user with the same ID detected: ${users.map(js => js \ "nexusId").mkString(" ")}"
                  logger.error(msg)
                  val id = (users.head \ "nexusId").as[String]
                  cacheUser(id, user).some.asRight
                } else if (users.size == 1) {
                  val id = (users.head \ "nexusId").as[String]
                  cacheUser(id, user).some.asRight
                } else {
                  None.asRight
                }
              case _ =>
                logger.error(s"Could not fetch the user with ID ${user.id} ${res.body}")
                APIEditorError(res.status, res.body).asLeft
            }
          }
      case Some(user) => Task.pure(user.some.asRight)
    }

  private def cacheUser(userId: String, user: IDMUser): EditorUser = {
    val editorUser = EditorUser(NexusInstanceReference.fromUrl(userId), user)
    cache.set(editorUser.user.id, editorUser, config.cacheExpiration)
    editorUser
  }

}
