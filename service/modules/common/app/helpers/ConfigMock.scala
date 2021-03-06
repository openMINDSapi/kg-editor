/*
 *   Copyright (c) 2020, EPFL/Human Brain Project PCO
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
package helpers

import play.api.inject.guice.GuiceApplicationBuilder

import scala.concurrent.duration.FiniteDuration

object ConfigMock {
  val nexusEndpoint: String = "http://www.nexus.com"
  val nexusIam = "nexus-iam.com"
  val authEndpoint = "auth.com"
  val refreshTokenFile = "/opt/tokenfolder"
  val kgQueryEndpoint = "kgqueryEndpoint"
  val editorSubspace = "editor"
  val cacheExpiration = FiniteDuration(10, "min")

  val fakeApplicationConfig = GuiceApplicationBuilder().configure(
    "play.http.filters" -> "play.api.http.NoHttpFilters",
    "nexus.endpoint" -> nexusEndpoint,
    "nexus.iam" -> nexusIam,
    "auth.endpoint"-> authEndpoint,
    "auth.refreshTokenFile" -> refreshTokenFile,
    "kgquery.endpoint" -> kgQueryEndpoint,
    "editor.subspace" -> editorSubspace,
    "cache.expiration" -> cacheExpiration.toMillis
  )
}
