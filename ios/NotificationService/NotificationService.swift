import UserNotifications

class NotificationService: UNNotificationServiceExtension {
  
  var contentHandler: ((UNNotificationContent) -> Void)?
  var bestAttemptContent: UNMutableNotificationContent?
  var rocketchat: RocketChat?
  var serviceExtension = ServiceExtension()
  
  override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
    self.contentHandler = contentHandler
    bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)
    
    if let bestAttemptContent = bestAttemptContent {
      let ejson = (bestAttemptContent.userInfo["ejson"] as? String ?? "").data(using: .utf8)!
      guard let data = try? (JSONDecoder().decode(Payload.self, from: ejson)) else {
        return
      }
      
      rocketchat = RocketChat.instanceForServer(server: data.host.removeTrailingSlash())
      
      if (data.msgType == "oncall") {
        self.sendData(data: data);
      }
      
      // If the notification has the content on the payload, show it
      if data.notificationType != .messageIdOnly {
        self.processPayload(payload: data)
        return
      }
      
      // Request the content from server
      rocketchat?.getPushWithId(data.messageId) { notification in
        if let notification = notification {
          self.bestAttemptContent?.title = notification.title
          self.bestAttemptContent?.body = notification.text
          self.processPayload(payload: notification.payload)
        }
      }
    }
  }
  
  func sendData(data: Payload) {
    
    var api = "https://shengwang-server.appia.vip/api/v1/oncall/user/get/notify";
    if (data.host.contains(".dev.")) {
      api = "https://shengwang-server-qa.appia.vip/api/v1/oncall/user/get/notify";
    }
    
    guard let url = URL(string: api) else {return}

            // Create a URL request
    var urlRequest = URLRequest(url: url)
    urlRequest.httpMethod = "POST"
    urlRequest.addValue("application/json", forHTTPHeaderField: "Content-Type")
    
    if (data.org != nil) {
      urlRequest.addValue(data.org!, forHTTPHeaderField: "org")
    }
    
    do {
      urlRequest.httpBody = try JSONSerialization.data(withJSONObject: ["recordId": data.recordId,"username":data.username], options: [])
    } catch {
        print("Error: cannot create JSON from parameters")
    }
            
    // Create a URLSession data task
    let task = URLSession.shared.dataTask(with: urlRequest) { data, response, error in
        if let error = error {
            // Handle any errors here
            print("Error fetching data: \(error)")
        } else if let data = data {
            // Process the data here
          let dataString = String(data: data, encoding: .utf8)
          print("Data as string: \(dataString ?? "Invalid string")")
        }
    }
    
    // Start the task
    task.resume()
  }
  
  func processPayload(payload: Payload) {
    // If is a encrypted message
    if payload.messageType == .e2e {
      if let message = payload.msg, let rid = payload.rid {
        if let decryptedMessage = rocketchat?.decryptMessage(rid: rid, message: message) {
          bestAttemptContent?.body = decryptedMessage
          if let roomType = payload.type, roomType == .group, let sender = payload.senderName {
            bestAttemptContent?.body = "\(sender): \(decryptedMessage)"
          }
        }
      }
    }
    
    
    if let bestAttemptContent = bestAttemptContent {
      if payload.msgType == "oncall" {
      
        self.serviceExtension.contentHandler = contentHandler
        self.serviceExtension.bestAttemptContent = bestAttemptContent
        self.serviceExtension.startVibrate()
       
        bestAttemptContent.sound = UNNotificationSound(named: UNNotificationSoundName(rawValue: "wx_calling.wav"))
      }
      contentHandler?(bestAttemptContent)
    }
  }
  
  override func serviceExtensionTimeWillExpire() {
    serviceExtension.stopVibrate()
  }
}
