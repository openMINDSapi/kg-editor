
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

import helpers.ConfigMock
import mockws.MockWSHelpers
import models._
import models.instance.{EditorInstance, NexusInstance}
import org.scalatest.Matchers._
import org.scalatest.mockito.MockitoSugar
import org.scalatestplus.play.PlaySpec
import org.scalatestplus.play.guice.GuiceOneAppPerSuite
import play.api.Application
import play.api.libs.json.{JsObject, JsValue, Json}
import play.api.libs.ws.WSClient
import play.api.test.Injecting

class FormServiceSpec extends PlaySpec with GuiceOneAppPerSuite with MockWSHelpers with MockitoSugar with Injecting {
  override def fakeApplication(): Application = ConfigMock.fakeApplicationConfig.build()

  "getFormStructure" should {
    "return a form with the instance content" in {
      val originalDatatype = NexusPath("minds/core/activity/v0.0.4")
      val id = "123"
      val revision = 2
      import scala.concurrent.ExecutionContext.Implicits._
      val formRegistry = FormRegistry(
        Map(
          originalDatatype -> UISpec(
            "Activity", Map(
              "http://schema.org/name" -> EditorFieldSpecification(
                "Name", None, InputText, None, None, None, None, None
              ),
              "http://hbp.eu/minds#methods" -> EditorFieldSpecification(
                "Methods", Some("minds/experiment/method/v0.0.4"), DropdownSelect,
                None, Some("id"), Some("label"), Some(true), Some(true)
              )
            ), Some(UIInfo(
              "http://schema.org/name", List("http://schema.org/name",
                "http://schema.org/description"), None
            ))
          )

        )
      )

      val config = new ConfigurationService(fakeApplication().configuration)
      val mockWs = mock[WSClient]
      val formService = new FormService(config, mockWs) {
        override def loadFormConfiguration(): FormRegistry = formRegistry
      }
      val data = Json.parse(
        s"""{
           |    "@context": "https://nexus-dev.humanbrainproject.org/v0/contexts/nexus/core/resource/v0.3.0",
           |    "@id": "https://nexus-dev.humanbrainproject.org/v0/data/${originalDatatype.toString()}/$id",
           |    "https://schema.hbp.eu/relativeUrl": "${originalDatatype.toString()}/$id",
           |    "@type": "http://hbp.eu/minds#Activity",
           |    "http://hbp.eu/internal#hashcode": "bd374187e78489b9b201bb885490c073",
           |    "http://hbp.eu/minds#created_at": "2018-03-26T15:21:58.362242+00:00",
           |    "http://hbp.eu/minds#methods": {
           |        "https://schema.hbp.eu/relativeUrl": "minds/experiment/method/v0.0.4/5481f012-fa64-4b0a-8614-648f09002519"
           |    },
           |    "http://schema.org/name": "365.A.e.#2"
           |    }
           |    """.stripMargin)

      val res = FormService.getFormStructure(originalDatatype, data.as[JsObject], formRegistry)
      val expected = Json.parse(
        """
          | {
          |  "fields": {
          |    "id": {
          |      "value": {
          |        "path": "minds/core/activity/v0.0.4"
          |      },
          |      "nexus_id": "minds/core/activity/v0.0.4/123"
          |    },
          |    "http://schema.org/name": {
          |      "type": "InputText",
          |      "label": "Name",
          |      "value": "365.A.e.#2"
          |    },
          |    "http://hbp.eu/minds#methods": {
          |      "type": "DropdownSelect",
          |      "label": "Methods",
          |      "instancesPath": "minds/experiment/method/v0.0.4",
          |      "mappingValue": "id",
          |      "mappingLabel": "label",
          |      "isLink": true,
          |      "allowCustomValues": true,
          |      "value": [
          |        {
          |          "id": "minds/experiment/method/v0.0.4/5481f012-fa64-4b0a-8614-648f09002519"
          |        }
          |      ]
          |    }
          |  },
          |  "label": "Activity",
          |  "editable": true,
          |  "ui_info": {
          |    "labelField": "http://schema.org/name",
          |    "promotedFields": [
          |      "http://schema.org/name",
          |      "http://schema.org/description"
          |    ]
          |  },
          |  "alternatives": {}
          |}
        """.stripMargin)
      val mapRes = res.as[Map[String, JsValue]]
      val mapExpected = expected.as[Map[String, JsValue]]
      mapRes should contain theSameElementsAs mapExpected

    }
  }

  "getRegistry" should {
    "populate the registry from a json object" in {
      val registry =
        Json.parse(
          """
            |{
            |  "_rev": "_XxTeP7K--_",
            |  "uiSpec": {
            |    "minds": {
            |      "core": {
            |        "dataset": {
            |          "v1.0.0": {
            |            "label": "Dataset",
            |            "ui_info": {
            |              "promote": true,
            |              "labelField": "http://schema.org/name",
            |              "promotedFields": [
            |                "http://schema.org/name",
            |                "http://schema.org/description"
            |              ]
            |            },
            |            "fields": {
            |              "https://schema.hbp.eu/minds/embargo_status": {
            |                "instancesPath": "minds/core/embargostatus/v1.0.0",
            |                "isLink": true,
            |                "mappingValue": "id",
            |                "closeDropdownAfterInteraction": true,
            |                "mappingLabel": "name",
            |                "label": "Embargo Status",
            |                "type": "DropdownSelect",
            |                "allowCustomValues": true
            |              },
            |              "http://schema.org/datalink": {
            |                "label": "Data link",
            |                "type": "InputText"
            |              }
            |            }
            |          }
            |        }
            |      },
            |      "experiment": {
            |        "protocol": {
            |          "v1.0.0": {
            |            "label": "Protocol",
            |            "ui_info": {
            |              "labelField": "http://schema.org/name",
            |              "promotedFields": [
            |                "http://schema.org/name"
            |              ]
            |            },
            |            "fields": {
            |              "http://schema.org/name": {
            |                "label": "Name",
            |                "type": "InputText"
            |              }
            |            }
            |          }
            |        }
            |      }
            |    }
            |  },
            |  "_id": "editor_specifications/minds",
            |  "_key": "minds"
            |}
          """.stripMargin)

      val res = FormService.getRegistry(List(registry.as[JsObject]))

      val expected = FormRegistry(
        Map(
          NexusPath("minds", "core", "dataset", "v1.0.0") -> UISpec(
            "Dataset", Map(
              "https://schema.hbp.eu/minds/embargo_status" -> EditorFieldSpecification(
                "Embargo Status", Some("minds/core/embargostatus/v1.0.0"),
                DropdownSelect, Some(true), Some("id"), Some("name"), Some(true),
                Some(true)
              ),
              "http://schema.org/datalink" -> EditorFieldSpecification(
                "Data link", None,
                InputText, None, None, None, None, None
              )
            ),
            Some(UIInfo(
              "http://schema.org/name",
              List("http://schema.org/name",
                "http://schema.org/description"),
              Some(true)
            ))
          ),
          NexusPath("minds", "experiment", "protocol", "v1.0.0") -> UISpec(
            "Protocol", Map(
              "http://schema.org/name" -> EditorFieldSpecification(
                "Name", None,
                InputText, None, None, None, None, None
              )
            ),
            Some(UIInfo(
              "http://schema.org/name",
              List("http://schema.org/name"),
              None
            ))
          )

        )
      )

      res.registry(NexusPath("minds", "core", "dataset", "v1.0.0")) mustBe expected.registry(NexusPath("minds", "core", "dataset", "v1.0.0"))
      res.registry(NexusPath("minds", "experiment", "protocol", "v1.0.0")) mustBe expected.registry(NexusPath("minds", "experiment", "protocol", "v1.0.0"))

    }
  }
  "getReverseLinks" should {
    "return an editor instance with a link to the main instance" in {
      val path = NexusPath("org", "domain", "schema", "version")
      val instanceId = "123"
      val doiPath = NexusPath("datacite/core/doi/v0.0.4")
      val targetField = "https://schema.hbp.eu/reference"
      val baseUrl = "http://nexus-dev.hbp.com"
      val formRegistry = FormRegistry(
        Map(
          path -> UISpec(
            "Activity", Map(
              "http://schema.org/name" -> EditorFieldSpecification(
                "Name", None, InputText, None, None, None, None, None
              ),
              "http://hbp.eu/minds#doi" -> EditorFieldSpecification(
                "Methods", Some("datacite/core/doi/v0.0.4"), DropdownSelect,
                None, Some("id"), Some("label"), Some(true), Some(true), Some(true), Some(targetField)
              )
            ), Some(UIInfo(
              "http://schema.org/name", List("http://schema.org/name",
                "http://schema.org/description"), None
            ))
          )

        )
      )
      val doiId = "456"
      val instance = EditorInstance(
        NexusInstance(
          Some(instanceId),
          path,
          Json.obj(
            "http://schema.org/name" -> "name",
            "http://hbp.eu/minds#doi"-> Json.obj(
              "@id" -> s"$baseUrl/v0/data/${doiPath.toString()}/$doiId"
            )
          )
        )
      )

      val expected = EditorInstance(
        NexusInstance(
          Some(doiId),
          doiPath,
          Json.obj(
            targetField-> Json.obj(
              "@id" -> s"$baseUrl/v0/data/${path.toString()}/$instanceId"
            )
          )
        )
      )

      val res = FormService.getReverseLinks(instance, formRegistry, baseUrl)

      res mustBe List(expected)

    }
  }

}
