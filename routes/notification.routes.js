import { Router } from 'express';
import { verification } from '../Middleware/Verification.js';
import { createNotification, deleteNotification, getAllNotificationsByUser, getAllReadNotificationsByUser, getAllUnReadNotificationsByUser, readNotification } from '../Controllers/notificationController.js';
const notification = Router();

notification.post('/createNotification', createNotification);
notification.delete('/deleteNotification/:id', deleteNotification);
notification.put('/readNotification', readNotification);
notification.get("/getAllNotificationsByUser/:user_id", getAllNotificationsByUser)
notification.get("/getAllReadNotificationsByUser/:user_id", getAllReadNotificationsByUser)
notification.get("/getAllUnReadNotificationsByUser/:user_id", getAllUnReadNotificationsByUser)
export default notification;
