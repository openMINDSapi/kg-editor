/*
 *   Copyright (c) 2019, EPFL/Human Brain Project PCO
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

package models.instance

import constants.EditorConstants
import models.user.User
import play.api.libs.functional.syntax._
import play.api.libs.json.Reads._
import play.api.libs.json.{JsPath, Json, Reads}

final case class Alternative(value: String, selected: Boolean, users: List[User])

object Alternative {

  implicit val alternativeReads: Reads[Alternative] = (
    (JsPath \ EditorConstants.VOCAB_VALUE).read[String] and
    (JsPath \ EditorConstants.VOCAB_SELECTED).read[Boolean] and
    (JsPath \ EditorConstants.VOCAB_USER).read[List[User]]
  )(Alternative.apply _)

  implicit val alternativeWrites = Json.writes[Alternative]
}
