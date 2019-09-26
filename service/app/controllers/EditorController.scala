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

package controllers

import actions.EditorUserAction
import javax.inject.{Inject, Singleton}
import helpers.InstanceHelper
import models.{instance, _}
import models.instance._
import models.specification.{FormRegistry, UISpec}
import monix.eval.Task
import play.api.Logger
import play.api.libs.json.Json.JsValueWrapper
import play.api.libs.json._
import play.api.mvc.{Action, _}
import services._
import services.specification.{FormOp, FormService}

import scala.concurrent.ExecutionContext

@Singleton
class EditorController @Inject()(
  cc: ControllerComponents,
  authenticatedUserAction: AuthenticatedUserAction,
  editorService: EditorService,
  TokenAuthService: TokenAuthService,
  config: ConfigurationService,
  iAMAuthService: IAMAuthService,
  formService: FormService,
  metadataService: MetadataService,
  reverseLinkService: ReverseLinkService
)(implicit ec: ExecutionContext)
    extends AbstractController(cc) {

  val logger = Logger(this.getClass)

  implicit val s = monix.execution.Scheduler.Implicits.global

  def deleteInstance(org: String, domain: String, schema: String, version: String, id: String): Action[AnyContent] =
    authenticatedUserAction.async { implicit request =>
      val nexusInstanceReference = NexusInstanceReference(org, domain, schema, version, id)
      editorService
        .deleteInstance(nexusInstanceReference, request.userToken)
        .map {
          case Right(()) => Ok("Instance has been deleted")
          case Left(err) => err.toResult
        }
        .runToFuture
    }

  def getInstanceScope(org: String, domain: String, schema: String, version: String, id: String): Action[AnyContent] =
    authenticatedUserAction.async { implicit request =>
      val nexusInstanceReference = NexusInstanceReference(org, domain, schema, version, id)
      editorService
        .getInstanceScope(nexusInstanceReference, request.userToken)
        .map {
          case Left(err)    => err.toResult
          case Right(value) => Ok(value)
        }
        .runToFuture
    }

  def addUserToInstanceScope(
    org: String,
    domain: String,
    schema: String,
    version: String,
    id: String,
    user: String
  ): Action[AnyContent] =
    authenticatedUserAction.async { implicit request =>
      val nexusInstanceReference = NexusInstanceReference(org, domain, schema, version, id)
      editorService
        .addUserToInstanceScope(nexusInstanceReference, user, request.userToken)
        .map {
          case Left(err) => err.toResult
          case Right(()) =>
            Ok(s"user ${user} has been added to instance ${org}/${domain}/${schema}/${version}/${id}' scope")
        }
        .runToFuture
    }

  def removeUserOfInstanceScope(
    org: String,
    domain: String,
    schema: String,
    version: String,
    id: String,
    user: String
  ): Action[AnyContent] =
    authenticatedUserAction.async { implicit request =>
      val nexusInstanceReference = NexusInstanceReference(org, domain, schema, version, id)
      editorService
        .removeUserOfInstanceScope(nexusInstanceReference, user, request.userToken)
        .map {
          case Left(err) => err.toResult
          case Right(()) =>
            Ok(s"user ${user} has been removed from instance ${org}/${domain}/${schema}/${version}/${id}' scope")
        }
        .runToFuture
    }

  private def getMetaDataByIds(
    ls: Seq[NexusInstance],
    formRegistry: FormRegistry[UISpec]
  ): List[Task[Option[JsObject]]] =
    ls.groupBy(_.id().get)
      .map {
        case (_, v) =>
          val formService: Task[Option[JsObject]] =
            FormOp.getFormStructure(v.head.nexusPath, v.head.content, formRegistry) match {
              case JsNull =>
                Task.pure(None)
              case instanceForm =>
                metadataService.getMetadata(v.head).map {
                  case Right(metadata) =>
                    Some(instanceForm.as[JsObject] ++ Json.obj("metadata" -> Json.toJson(metadata)))
                  case Left(_) =>
                    Some(instanceForm.as[JsObject])
                }
            }
          formService
      }
      .toList

  //  def getStructure(withLinks: Boolean): Action[AnyContent] =
  //    authenticatedUserAction.async { implicit request =>
  //      val result = for {
  //        typeInfoOpt <- editorService.retrieveTypes(
  //          s"${EditorConstants.EDITORNAMESPACE}typeInfo",
  //          request.userToken,
  //          false
  //        )
  //        structureOpt <- editorService.retrieveStructure(withLinks)
  //      } yield {
  //        (typeInfoOpt, structureOpt) match {
  //          case (Right(typeInfo), Right(structure)) =>
  //            val infoProps = List[(String, String, Option[JsValue])](
  //              ("https://schema.hbp.eu/client/kg-editor/labelField", "labelInfo", None),
  //              ("https://schema.hbp.eu/client/kg-editor/promotedFields", "promotedFields", Some(JsArray()))
  //            )
  //            val typeInfoMap =
  //              (typeInfo \ "data").as[List[Map[String, JsValue]]].foldLeft(Map[String, Map[String, JsValue]]()) {
  //                case (map, info) =>
  //                  val typeMap = infoProps.foldLeft(Map[String, JsValue]()) {
  //                    case (map, (in: String, out: String, default: Option[JsValue])) =>
  //                      info.get(in) match {
  //                        case Some(value) => map.updated(out, value)
  //                        case None =>
  //                          default match {
  //                            case Some(d) => map.updated(out, d)
  //                            case None    => map
  //                          }
  //                      }
  //                  }
  //                  info.get("https://schema.hbp.eu/client/kg-editor/describedType") match {
  //                    case Some(typeName) => map.updated(typeName.as[String], typeMap)
  //                    case None           => map
  //                  }
  //              }
  //            val res = (structure \ "data").as[List[Map[String, JsValue]]].foldLeft(List[Map[String, JsValue]]()) {
  //              case (list, structureField) =>
  //                structureField.get("id") match {
  //                  case Some(typeName) =>
  //                    typeInfoMap.get(typeName.as[String]) match {
  //                      case Some(r) =>
  //                        val field = r.foldLeft(structureField) {
  //                          case (map, (k, v)) =>
  //                            map.updated(k, v)
  //                        }
  //                        list :+ field
  //                      case None => list
  //                    }
  //                  case None => list
  //                }
  //            }
  //            Ok(Json.toJson(EditorResponseObject(Json.toJson(res))))
  //          case _ => InternalServerError("Something went wrong! Please try again!")
  //        }
  //      }
  //      result.runToFuture
  //    }

  def getStructure(withFields: Boolean): Action[AnyContent] =
    authenticatedUserAction.async { implicit request =>
      editorService
        .retrieveStructure(withFields)
        .map {
          case Left(err)    => err.toResult
          case Right(value) => Ok(value)
        }
        .runToFuture
    }

  //  TODO: Deprecate either this one or getInstancesByIds
  def getInstances(allFields: Boolean, databaseScope: Option[String], metadata: Boolean): Action[AnyContent] =
    authenticatedUserAction.async { implicit request =>
      val listOfIds = for {
        bodyContent <- request.body.asJson
        ids         <- bodyContent.asOpt[List[String]]
      } yield ids
      val result = listOfIds match {
        case Some(ids) =>
          editorService
            .retrieveInstances(ids, request.userToken, databaseScope, metadata)
            .flatMap {
              case Right(instancesResult) =>
                val typesToRetrieve = (instancesResult \ "data")
                  .as[JsArray]
                  .value
                  .toList
                  .flatMap(instance => (instance \ "@type").as[List[String]])
                editorService
                  .retrieveTypesList(typesToRetrieve.distinct, request.userToken, withFields = true)
                  .map {
                    case Right(typesWithFields) =>
                      if (allFields) {
                        Ok(
                          Json.toJson(
                            EditorResponseObject(
                              Json.toJson(InstanceHelper.normalizeInstancesData(instancesResult, typesWithFields))
                            )
                          )
                        )
                      } else {
                        Ok(
                          Json.toJson(
                            EditorResponseObject(
                              Json.toJson(InstanceHelper.normalizeInstanceSummaryData(instancesResult, typesWithFields))
                            )
                          )
                        )
                      }
                    case _ => InternalServerError("Something went wrong! Please try again!")
                  }
              case _ => Task.pure(InternalServerError("Something went wrong! Please try again!"))
            }
        case None => Task.pure(BadRequest("Wrong body content!"))
      }
      result.runToFuture
    }

  def filterBookmarkInstances(
    bookmarkId: String,
    from: Option[Int],
    size: Option[Int],
    search: String
  ): Action[AnyContent] =
    authenticatedUserAction.async { implicit request =>
      editorService
        .getBookmarkInstances(bookmarkId, from, size, search, request.userToken)
        .map {
          case Right(value) => Ok(value)
          case Left(error)  => error.toResult
        }
        .runToFuture
    }

  def searchInstances(
    typeId: Option[String],
    from: Option[Int],
    size: Option[Int],
    search: String
  ): Action[AnyContent] =
    authenticatedUserAction.async { implicit request =>
      editorService
        .doSearchInstances(typeId, from, size, search, request.userToken)
        .map {
          case Right(value) => Ok(value)
          case Left(error)  => error.toResult
        }
        .runToFuture
    }

  //  TODO: This method is deprecated! Use getInstances instead
  def getInstancesByIds(allFields: Boolean, databaseScope: Option[String]): Action[AnyContent] =
    authenticatedUserAction.async { implicit request =>
      val listOfIds = for {
        bodyContent <- request.body.asJson
        ids         <- bodyContent.asOpt[List[String]]
      } yield ids.map(NexusInstanceReference.fromUrl)
      formService
        .getRegistries()
        .flatMap { registries =>
          listOfIds match {
            case Some(ids) =>
              editorService
                .retrieveInstancesByIds(
                  ids,
                  request.userToken,
                  if (allFields) "editorFull" else "editorPreview",
                  databaseScope
                )
                .flatMap {
                  case Left(err) => Task.pure(err.toResult)
                  case Right(ls) =>
                    if (allFields) {
                      val listOfIds: List[Task[Option[JsObject]]] = getMetaDataByIds(ls, registries.formRegistry)
                      Task.sequence(listOfIds).map { l =>
                        val jsonList = l.collect {
                          case Some(r) => r
                        }
                        Ok(Json.toJson(EditorResponseObject(Json.toJson(jsonList))))
                      }
                    } else {
                      val previews = ls.map(i => i.content.as[PreviewInstance].setLabel(registries.formRegistry)).toList
                      Task.pure(Ok(Json.toJson(EditorResponseObject(Json.toJson(previews)))))
                    }
                }
            case None => Task.pure(BadRequest("Missing body content"))
          }
        }
        .runToFuture
    }

  def getInstanceGraph(org: String, domain: String, datatype: String, version: String, id: String): Action[AnyContent] =
    authenticatedUserAction.async { implicit request =>
      val nexusInstanceReference = NexusInstanceReference(org, domain, datatype, version, id)
      editorService
        .retrieveInstanceGraph(nexusInstanceReference, request.userToken)
        .map {
          case Left(err)    => err.toResult
          case Right(value) => Ok(value)
        }
        .runToFuture
    }

  def getInstanceRelease(
    org: String,
    domain: String,
    datatype: String,
    version: String,
    id: String
  ): Action[AnyContent] = authenticatedUserAction.async { implicit request =>
    val nexusInstanceReference = NexusInstanceReference(org, domain, datatype, version, id)
    editorService
      .retrieveInstanceRelease(nexusInstanceReference, request.userToken)
      .map {
        case Left(err)    => err.toResult
        case Right(value) => Ok(value)
      }
      .runToFuture
  }

  def postReleaseInstance(releaseTreeScope: String): Action[AnyContent] = authenticatedUserAction.async {
    implicit request =>
      val listOfIds = for {
        bodyContent <- request.body.asJson
        ids         <- bodyContent.asOpt[List[String]]
      } yield ids.map(NexusInstanceReference.fromUrl)
      listOfIds match {
        case Some(ids) =>
          editorService
            .retrieveReleaseStatus(ids, releaseTreeScope, request.userToken)
            .map {
              case Left(err)    => err.toResult
              case Right(value) => Ok(value)
            }
            .runToFuture
        case None => Task.pure(BadRequest("Missing body content")).runToFuture
      }

  }

  def putInstanceRelease(
    org: String,
    domain: String,
    datatype: String,
    version: String,
    id: String
  ): Action[AnyContent] = authenticatedUserAction.async { implicit request =>
    val nexusInstanceReference = NexusInstanceReference(org, domain, datatype, version, id)
    editorService
      .releaseInstance(nexusInstanceReference, request.userToken)
      .map {
        case Left(err) => err.toResult
        case Right(()) => Ok("Instance has been released")
      }
      .runToFuture
  }

  def deleteInstanceRelease(
    org: String,
    domain: String,
    datatype: String,
    version: String,
    id: String
  ): Action[AnyContent] = authenticatedUserAction.async { implicit request =>
    val nexusInstanceReference = NexusInstanceReference(org, domain, datatype, version, id)
    editorService
      .unreleaseInstance(nexusInstanceReference, request.userToken)
      .map {
        case Left(err) => err.toResult
        case Right(()) => Ok("Instance has been unreleased")
      }
      .runToFuture
  }

  def getQuery(): Action[AnyContent] = authenticatedUserAction.async { implicit request =>
    editorService
      .retrieveQuery(request.userToken)
      .map {
        case Left(err)    => err.toResult
        case Right(value) => Ok(value)
      }
      .runToFuture
  }

  def deleteQuery(org: String, domain: String, schema: String, version: String, queryId: String): Action[AnyContent] =
    authenticatedUserAction.async { implicit request =>
      val instancePath = NexusPath(org, domain, schema, version)
      editorService
        .deleteQuery(instancePath, queryId, request.userToken)
        .map {
          case Right(()) => Ok("Deleted specification from database")
          case Left(err) => err.toResult
        }
        .runToFuture
    }

  def saveQuery(org: String, domain: String, schema: String, version: String, queryId: String): Action[AnyContent] =
    authenticatedUserAction.async { implicit request =>
      val bodyContent = request.body.asJson
      val instancePath = NexusPath(org, domain, schema, version)
      bodyContent match {
        case Some(content) =>
          editorService
            .saveQuery(instancePath, queryId, content.as[JsObject], request.userToken)
            .map {
              case Right(()) => Ok("Saved specification to database")
              case Left(err) => err.toResult
            }
            .runToFuture
        case None => Task.pure(BadRequest("Missing body content")).runToFuture
      }
    }

  def getSuggestions(
    org: String,
    domain: String,
    schema: String,
    version: String,
    field: String,
    fieldType: String,
    size: Int,
    start: Int,
    search: String
  ): Action[AnyContent] = authenticatedUserAction.async { implicit request =>
    val bodyContent = request.body.asJson
    val instancePath = NexusPath(org, domain, schema, version)
    bodyContent match {
      case Some(content) =>
        editorService
          .retrieveSuggestions(
            instancePath,
            field,
            fieldType,
            size,
            start,
            search,
            content.as[JsObject],
            request.userToken
          )
          .map {
            case Right(value) => Ok(value)
            case Left(err)    => err.toResult
          }
          .runToFuture
      case None => Task.pure(BadRequest("Missing body content")).runToFuture
    }
  }

  def performQuery(
    org: String,
    domain: String,
    schema: String,
    version: String,
    vocab: Option[String],
    size: Int,
    start: Int,
    databaseScope: Option[String]
  ): Action[AnyContent] =
    authenticatedUserAction.async { implicit request =>
      val bodyContent = request.body.asJson
      val instancePath = NexusPath(org, domain, schema, version)
      bodyContent match {
        case Some(content) =>
          editorService
            .doQuery(instancePath, vocab, size, start, databaseScope, content.as[JsObject], request.userToken)
            .map {
              case Right(value) => Ok(value)
              case Left(err)    => err.toResult
            }
            .runToFuture
        case None => Task.pure(BadRequest("Missing body content")).runToFuture
      }
    }

  class MapWrites[T]()(implicit writes: Writes[T]) extends Writes[Map[NexusPath, T]] {

    def writes(map: Map[NexusPath, T]): JsValue =
      Json.obj(map.map {
        case (s, o) =>
          val ret: (String, JsValueWrapper) = s.toString -> Json.toJson(o)
          ret
      }.toSeq: _*)
  }

  def getUiDirectivesMessages(): Action[AnyContent] = authenticatedUserAction.async { implicit request =>
    formService
      .getRegistries()
      .map { registries =>
        val instancesWithMessages = registries.formRegistry.registry
          .foldLeft(Map[NexusPath, JsObject]()) {
            case (acc, (k, v)) =>
              val m = for {
                directive <- v.uiDirective
                messages  <- (directive \ "messages").asOpt[JsObject]
              } yield messages
              m match {
                case Some(message) => acc.updated(k, message)
                case None          => acc
              }
          }

        Ok(Json.toJson(EditorResponseObject(Json.toJson(instancesWithMessages)(new MapWrites[JsObject]()))))
      }
      .runToFuture
  }

  def getInstanceNumberOfAvailableRevisions(
    org: String,
    domain: String,
    datatype: String,
    version: String,
    id: String
  ): Action[AnyContent] =
    authenticatedUserAction.async { implicit request =>
      val nexusInstanceRef = NexusInstanceReference(org, domain, datatype, version, id)
      formService
        .getRegistries()
        .flatMap { registries =>
          editorService
            .retrieveInstance(nexusInstanceRef, request.userToken, registries.queryRegistry)
            .flatMap[Result] {
              case Left(error) =>
                Task.pure(error.toResult)
              case Right(originalInstance) =>
                val nbRevision = (originalInstance.content \ "nxv:rev").as[JsNumber]
                Task.pure(Ok(Json.obj("available_revisions" -> nbRevision, "path" -> id)))
            }
        }
        .runToFuture
    }

  /**
    * Entry point when updating an instance
    *
    * @param org     The organization of the instance
    * @param domain  The domain of the instance
    * @param schema  The schema of the instance
    * @param version The version of the schema
    * @param id      The id of the instance
    * @return A result with the instance updated or an error message
    */
  def updateInstance(org: String, domain: String, schema: String, version: String, id: String): Action[AnyContent] =
    (authenticatedUserAction andThen EditorUserAction.editorUserWriteAction(org, config.editorPrefix, iAMAuthService))
      .async { implicit request =>
        val instanceRef = NexusInstanceReference(org, domain, schema, version, id)
        editorService
          .updateInstanceFromForm(instanceRef, request.body.asJson, request.user, request.userToken, reverseLinkService)
          .flatMap {
            case Right(()) =>
              formService.getRegistries().flatMap { registries =>
                editorService
                  .retrieveInstance(instanceRef, request.userToken, registries.queryRegistry)
                  .flatMap {
                    case Right(instance) =>
                      FormOp
                        .getFormStructure(instanceRef.nexusPath, instance.content, registries.formRegistry) match {
                        case JsNull =>
                          Task.pure(NotImplemented("Form not implemented"))
                        case instanceForm =>
                          val specFlush = formService.shouldReloadSpecification(instanceRef.nexusPath).flatMap {
                            shouldReload =>
                              if (shouldReload) {
                                formService.flushSpec()
                              } else {
                                Task.pure(())
                              }
                          }
                          specFlush.map { _ =>
                            Ok(Json.toJson(EditorResponseObject(instanceForm.as[JsObject])))
                          }
                      }
                    case Left(error) =>
                      logger.error(error.toString)
                      Task.pure(error.toResult)
                  }
              }
            case Left(error) =>
              logger.error(error.content.mkString("\n"))
              Task.pure(error.toResult)
          }
          .runToFuture
      }

  /**
    * Creation of a new instance in the editor
    *
    * @param org     The organization of the instance
    * @param domain  The domain of the instance
    * @param schema  The schema of the instance
    * @param version The version of the schema
    * @return 201 Created
    */
  def createInstance(org: String, domain: String, schema: String, version: String): Action[AnyContent] =
    (authenticatedUserAction andThen EditorUserAction.editorUserWriteAction(org, config.editorPrefix, iAMAuthService))
      .async { implicit request =>
        val instancePath = NexusPath(org, domain, schema, version)
        editorService
          .insertInstance(NexusInstance(None, instancePath, Json.obj()), Some(request.user), request.userToken)
          .flatMap[Result] {
            case Left(error) => Task.pure(error.toResult)
            case Right(ref) =>
              request.body.asJson match {
                case Some(content) =>
                  formService.getRegistries().flatMap { registries =>
                    val nonEmptyInstance = FormOp.buildNewInstanceFromForm(
                      ref,
                      config.nexusEndpoint,
                      content.as[JsObject],
                      registries.formRegistry
                    )
                    editorService
                      .updateInstance(nonEmptyInstance, ref, request.userToken, request.user.id)
                      .flatMap[Result] {
                        case Right(()) =>
                          val specFlush = formService.shouldReloadSpecification(instancePath).flatMap { shouldReload =>
                            if (shouldReload) {
                              formService.flushSpec()
                            } else {
                              Task.pure(())
                            }
                          }
                          specFlush.map { _ =>
                            Created(Json.toJson(EditorResponseObject(Json.toJson(ref))))
                          }
                        case Left(error) => Task.pure(error.toResult)
                      }
                  }
                case None => Task.pure(Created(Json.toJson(EditorResponseObject(Json.toJson(ref)))))
              }
          }
          .runToFuture
      }

  /**
    * Returns an empty form for a specific instance type
    *
    * @param org     The organization of the instance
    * @param domain  The domain of the instance
    * @param schema  The schema of the instance
    * @param version The version of the schema
    * @return 200
    */
  def getEmptyForm(org: String, domain: String, schema: String, version: String): Action[AnyContent] =
    authenticatedUserAction.async { implicit request =>
      val nexusPath = NexusPath(org, domain, schema, version)
      formService
        .getRegistries()
        .map { registries =>
          val form = FormOp.getFormStructure(nexusPath, JsNull, registries.formRegistry)
          Ok(form)
        }
        .runToFuture
    }

}