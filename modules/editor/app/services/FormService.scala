
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

import com.google.inject.{Inject, Singleton}
import models.editorUserList.BookmarkList
import models._
import models.instance.{NexusInstance, ReconciledInstance}
import models.user.NexusUser
import play.api.libs.json._
import play.api.libs.ws.WSClient

import scala.concurrent.duration.FiniteDuration
import scala.concurrent.{Await, ExecutionContext}


@Singleton
class FormService @Inject()(
                             config: ConfigurationService,
                             ws: WSClient
                           )(implicit ec: ExecutionContext){

  lazy val formRegistry: FormRegistry = loadFormConfiguration()
  val timeout = FiniteDuration(15, "sec")

  def loadFormConfiguration(): FormRegistry = {
    val spec = Await.result(
      ws.url(s"${config.kgQueryEndpoint}/arango/document/editor_specifications").get(),
      timeout
    )
    FormRegistry(
      spec.json.as[List[JsObject]].foldLeft(Json.obj()) {
        case (acc, el) => acc ++ (el \ "uiSpec").as[JsObject]
      }
    )
  }
}
object FormService{

  val slashEscaper = "%nexus-slash%"
  object FormRegistryService extends FormRegistryService

  def removeKey(jsValue: JsValue):JsValue = {
    if (jsValue.validateOpt[JsObject].isSuccess) {
      if(jsValue.toString() == "null"){
        JsNull
      }else{
        val correctedObj = jsValue.as[JsObject] - "description" - "label" - "status" - "childrenStatus"
        val res = correctedObj.value.map {
          case (k, v) =>
            k -> removeKey(v)
        }
        Json.toJson(res)
      }
    } else if (jsValue.validateOpt[JsArray].isSuccess) {
      Json.toJson(jsValue.as[JsArray].value.map(removeKey))
    } else {
      jsValue
    }
  }

  def transformToArray(key: String, data: JsValue): JsArray = {
    if ((data \ key \ "@list").isDefined) {
     (data \ key \ "@list").as[JsArray]
    } else if ((data \ key ).validate[JsArray].isSuccess){
      (data \ key ).as[JsArray]
    }else {
      if ((data \ key \ "@id").isDefined) {
        val linkToInstance = (data \ key \ "@id").as[String]
        if (linkToInstance.contains("http")){
//          val(id, path) = NexusInstance.extractIdAndPathFromString(linkToInstance)
          JsArray().+:(Json.obj("id" -> JsString(linkToInstance)))
        } else {
          JsArray()
        }
      } else {
        JsArray()
      }
    }
  }

//  def transformID(jsArray: JsArray):JsArray = {
//    Json.toJson(
//      jsArray.value.collect{
//        case el if ((el \ "@id").as[String] contains "http") =>
//          val(id, path) = NexusInstance.extractIdAndPathFromString((el \ "@id").as[String])
//          val instancePath = path.originalPath(reconciledSuffix)
//          Json.obj("id" -> JsString(instancePath.toString() + s"/$id"))
//      }
//    ).as[JsArray]
//  }

  def buildEditableEntityTypesFromRegistry(registry: FormRegistry): List[BookmarkList] = {
    registry.registry.value.flatMap{
      case (organization, organizationDetails) =>
        organizationDetails.as[JsObject].value.flatMap{
          case (domain, domainDetails) =>
            domainDetails.as[JsObject].value.flatMap{
              case (schema, schemaDetails) =>
                schemaDetails.as[JsObject].value.map{
                  case (version, formDetails) =>
                    BookmarkList(
                      s"$organization/$domain/$schema/$version",
                      (formDetails.as[JsObject] \ "label").as[String],
                      Some((formDetails.as[JsObject] \ "editable").asOpt[Boolean].getOrElse(true)),
                      (formDetails.as[JsObject] \ "ui_info").asOpt[JsObject],
                      (formDetails.as[JsObject] \ "color").asOpt[String]
                    )
                }
            }
        }
    }.toSeq.sortWith{case (jsO1, jsO2) => jsO1.name < jsO2.name}.toList
  }

  def buildInstanceFromForm(original: NexusInstance, modificationFromUser: JsValue, nexusEndpoint: String): NexusInstance = {
    //    val flattened = JsFlattener(formContent)
    //    applyChanges(original, flattened)
    val formContent = Json.parse(modificationFromUser.toString()).as[JsObject] - "id"
    val cleanForm = FormService.removeKey(formContent.as[JsValue])
    val formWithID = cleanForm.toString().replaceAll(""""id":"""", s""""@id":"${nexusEndpoint}/v0/data/""")
    val res= original.content.deepMerge(Json.parse(formWithID).as[JsObject])
    original.copy(content = res)
  }

  def isInSpec(id:String, registry: FormRegistry):Boolean = {
    val list = FormService.buildEditableEntityTypesFromRegistry(registry)
      .map(l => l.id)
    list.contains(id)
  }

  def buildNewInstanceFromForm(nexusEndpoint: String, instancePath: NexusPath, newInstance: JsObject, registry: FormRegistry): JsObject = {

    def addNexusEndpointToLinks(item: JsValue): JsObject = {
      val id = (item.as[JsObject] \ "id" ).as[String]
      if(!id.startsWith("http://")){
        Json.obj("@id" ->  JsString(s"$nexusEndpoint/v0/data/$id"))
      }else{
        Json.obj("@id" ->  JsString(id))
      }
    }

    val fields = (registry.registry \ instancePath.org \ instancePath.domain \ instancePath.schema \ instancePath.version \ "fields").as[JsObject].value
    val m = newInstance.value.map{ case (key, v) =>
      val formObjectType = (fields(key) \ "type").as[String]
      formObjectType match {
        case "DropdownSelect" =>
          val arr: IndexedSeq[JsValue] = v.as[JsArray].value.map{ item =>
            addNexusEndpointToLinks(item)
          }
          key -> Json.toJson(arr)
        case _ =>
          if( (fields(key) \ "isLink").asOpt[Boolean].getOrElse(false)){
            key -> addNexusEndpointToLinks(v)
          } else{
            key -> v
          }
      }
    }
    Json.toJson(m).as[JsObject]
  }

  def getFormStructure(entityType: NexusPath, data: JsValue, formRegistry: FormRegistry): JsValue = {
    // retrieve form template
    val formTemplateOpt = (formRegistry.registry \ entityType.org \ entityType.domain \ entityType.schema \ entityType.version).asOpt[JsObject]

    formTemplateOpt match {
      case Some(formTemplate) =>
        if(data != JsNull){

          val nexusId = (data \ "@id").as[String]
          // fill template with data
          val idFields = Json.obj(
            "id" -> Json.obj(
              "value" -> Json.obj(
                "path" -> entityType.toString()),
              "nexus_id" -> JsString(nexusId))
          )

          val fields = (formTemplate \ "fields").as[JsObject].fields.foldLeft(idFields) {
            case (filledTemplate, (key, fieldContent)) =>
              if (data.as[JsObject].keys.contains(key)) {
                val newValue = (fieldContent \ "type").asOpt[String].getOrElse("") match {
                  case "DropdownSelect" =>
                    fieldContent.as[JsObject] + ("value", FormService.transformToArray(key, data))
                  case _ =>
                    fieldContent.as[JsObject] + ("value", (data \ key).get)
                }

                filledTemplate + (key, newValue)
              } else {
                filledTemplate + (key, fieldContent.as[JsObject] )
              }
          }
          fillFormTemplate(fields, formTemplate, (data \ ReconciledInstance.Fields.alternatives).asOpt[JsObject].getOrElse(Json.obj()) )

        }else {
          //Returning a blank template
          val escapedForm = ( formTemplate \ "fields" ).as[JsObject].value.map{
            case (key, value) =>
              (key , value)
          }
          fillFormTemplate(Json.toJson(escapedForm), formTemplate, Json.obj() )
        }
      case None =>
        JsNull
    }
  }


  def fillFormTemplate(fields: JsValue, formTemplate:JsValue, alternatives: JsObject = Json.obj()): JsValue ={
    Json.obj("fields" -> fields) +
      ("label", (formTemplate \ "label").get) +
      ("editable", JsBoolean((formTemplate.as[JsObject] \ "editable").asOpt[Boolean].getOrElse(true))) +
      ("ui_info", (formTemplate \ "ui_info").getOrElse(JsObject.empty)) +
      ("alternatives", alternatives )
  }

  def editableEntities(user: NexusUser, formRegistry: FormRegistry): List[BookmarkList] = {
    val registry = FormRegistryService.filterOrgs(formRegistry, user.organizations)
    buildEditableEntityTypesFromRegistry(registry)
  }




}
