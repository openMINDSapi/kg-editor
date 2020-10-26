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

import com.google.inject.Inject
import models.AccessToken
import models.errors.APIEditorError
import monix.eval.Task
import play.api.Logger
import play.api.http.HeaderNames._
import play.api.http.Status._
import play.api.libs.json.{JsObject, JsValue, Json}
import play.api.libs.ws.WSClient

class EditorUserService @Inject()(config: ConfigurationServiceLive, wSClient: WSClient) {
  val logger = Logger(this.getClass)

  object cacheService extends CacheService

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

  def putUserPicture(token: AccessToken, clientToken: String, userId: String, picture: JsValue): Task[Either[APIEditorError, JsObject]] = {
    val q = wSClient
      .url(s"${config.kgCoreEndpoint}/${config.kgCoreApiVersion}/users/${userId}/picture")
      .withHttpHeaders(AUTHORIZATION -> token.token, "Client-Authorization" -> clientToken)
    val r = Task.deferFuture(q.put(picture))
    r.map { res =>
      res.status match {
        case OK => Right(res.json.as[JsObject])
        case _  => Left(APIEditorError(res.status, res.body))
      }
    }
  }

  def getUsersPicture(token: AccessToken, clientToken: String, userIds: List[String]): Task[Either[APIEditorError, JsObject]] = {
    val payload = Json.toJson(userIds)
    val q = wSClient
      .url(s"${config.kgCoreEndpoint}/${config.kgCoreApiVersion}/users/pictures")
      .withHttpHeaders(AUTHORIZATION -> token.token, "Client-Authorization" -> clientToken)
    val r = Task.deferFuture(q.post(payload))
    r.map { res =>
      res.status match {
        case OK => Right(res.json.as[JsObject])
        case _  => Left(APIEditorError(res.status, res.body))
      }
    }
  }
}