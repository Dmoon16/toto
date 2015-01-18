(ns totto.handlers.app
  (:require [totto.tmpls :as tmpl])
  (:use org.httpkit.server))

(defn show-landing [req]
  (tmpl/landing {:user-agent (get-in req [:headers "user-agent"])
                 :title "Toto"
                 :base (get-in req [:headers "host"])}))

(defn syncup [req] 
	; (if-not (:websocket? req)
	; 	{:status 200 :body "Welcome to the chatroom! JS client connecting..."}
	; 	(with-channel req ch
	; 		(println "New WebSocket channel:" ch)
	; 		(on-receive ch (fn [msg] (println "on-receive:" msg)))
	; 		(on-close ch (fn [status] (println "on-close:" status)))
	; 		(send! ch "First chat message!"))))
	(with-channel req channel
		(println "Received websocket connection" channel)
		(on-close channel (fn [status] (println "channel closed: " status)))
		(on-receive channel (fn [data] ;; echo it back
			(println "Received data" data)
			(send! channel data)))))
