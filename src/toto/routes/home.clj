(ns toto.routes.home
  (:require [compojure.core :refer :all]
            [toto.layout :as layout]
            [toto.util :as util]
            [noir.response :refer [content-type]])
  (:use [org.httpkit.server]))

(def channels (atom #{}))

(defn sync-socket [request]
    (println "Request: " request)
    (if-not (:websocket? request)
        (content-type "text/html" "Async only, please..")
        (with-channel request ch
            (println "New WebSocket channel:" ch)
            (on-receive ch (fn [msg] (println "on-receive:" msg)))
            (on-close ch (fn [status] (println "on-close:" status)))
            (send! ch "First chat message!"))))

(defn home-page [req]
  (layout/render
    "home.html" {:base (get (:headers req) "host")}))

(defn about-page []
  (layout/render "about.html"))

(defroutes home-routes
  (GET "/" [] home-page)
  (GET "/about" [] (about-page))
  (GET "/sync" [] sync-socket))
