(ns totto.handlers.app
  (:require 
  	[totto.tmpls :as tmpl]
  	[clojure.set :refer [union]]
  	[clojure.data.json :refer [read-str write-str]])
  (:use org.httpkit.server))

(def clients (atom {}))
(def todos (atom #{}))

(defn show-landing [req]
  (tmpl/landing {:user-agent (get-in req [:headers "user-agent"])
                 :title "Toto"
                 :base (get-in req [:headers "host"])}))

(defn syncup [req]
	(with-channel req channel
		(swap! clients assoc channel true)
		(on-close channel (fn [status] 
			(swap! clients dissoc channel)
			(println "Client disconnected: " status)))
		(on-receive channel (fn [evt]
			(swap! todos union (into #{} (get (read-str evt) "data")))
			(println "Sending data " {:event "syncdown" :data @todos})
			(doseq [c (keys @clients)] 
				(send! c (write-str {:event "syncdown" :data @todos})))))))
