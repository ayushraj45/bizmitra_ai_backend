// // This is all just examples, just to get a feel of how it's gonna look like
// export async function queryBusinessDetails({ query }) {
//   // e.g., search your DB, JSON, or API
//   if (query.includes("dark mode")) {
//     return { result: "Yes, our app supports dark mode." };
//   }
//   return { result: "Not found" };
// }

import bclientService from "../services/bclientService.js";
import btaskService from "../services/btaskService.js";
import businessService from "../services/businessService.js";
import threadService from "../services/threadService.js";
import { google } from "googleapis";
import dotenv from 'dotenv';
import bookingService from "../services/bookingService.js";
dotenv.config();

// export async function escalateToHuman({ question }) {
//   // Send SMS, email, or notification to your user
//   console.log("Escalating:", question);
//   return { status: "User notified" };
// }


export async function createOwnerTask (threadId, task, priority) {

  const thread = await threadService.getThreadById(threadId); 
  const bTask = btaskService.createBTask({
    business_id: thread.business_id,
    client_id: thread.client_id,
    status: 'open',
    description: task,
    priority: priority
  })

  if(bTask){
    console.log('bTask created, ', bTask);
    return 'Task created successfully'
  }
else return 'Task creation unsuccessful, try again'
} 

export async function getBusinessClientSchedule(threadId){
  const thread = await threadService.getThreadById(threadId); 
  const bookings = await bookingService.getAllBookingsById(thread.business_id, thread.client_id);
  let clientBookings = []
  let history = [...thread.context];
  if(bookings){
      for (const booking of bookings){
        const bookingDetails = {
          bookingId: booking.id,
          description: booking.session_type,
          startTime: booking.start_time,
          endTime: booking.end_time
        }
        clientBookings.push(bookingDetails);
        
      }
  }
  console.log(JSON.stringify(clientBookings));
  history.push({role:"assistant", content: JSON.stringify(clientBookings)});
  await threadService.updateThread(threadId, {context: history});
  return JSON.stringify(clientBookings);
}

export async function rescheduleBooking(threadId, bookingId, newDescription, isoDateTimeStart, isoDateTimeEnd){
  console.log('BOoking ID: ', bookingId)
  const thread = await threadService.getThreadById(threadId); 
  //const booking = await bookingService.getBookingByStartAndEndTime(thread.business_id, thread.client_id,currentTimeStart,currentTimeEnd);
  const booking = await bookingService.getBookingById(bookingId); 
  console.log('booking: ', booking);
  const calendar = await getOAuthCalendar(threadId);
  const nomoCalendar = await getOrCreateNomoCalendar(calendar);
  //We must find the booking to get the eventId
  if(booking){
      const newSummary = newDescription? newDescription : booking.session_type;
      const start = new Date(isoDateTimeStart);
      const end = new Date(isoDateTimeEnd); 
      const freeBusy = await calendar.freebusy.query({
        requestBody: {
          timeMin: start.toISOString(),
          timeMax: end.toISOString(),
          items: [{ id: nomoCalendar.id }],
        },
      });

      const busySlots = freeBusy.data.calendars[nomoCalendar.id].busy;

      if (busySlots.length > 0) {
        return 'Slot occupied, please ask for another slot for rescheduling';
      }
      
      const updatedEvent = await calendar.events.update({
      calendarId: nomoCalendar.id,
      eventId: booking.event_id,
      requestBody: {
        start: { dateTime: isoDateTimeStart, timeZone: 'UTC' },
        end: { dateTime: isoDateTimeEnd, timeZone: 'UTC' },
        summary: newSummary,
      },
    });

    if(updatedEvent){
      await bookingService.updateBooking(booking.id,{session_type: newDescription, start_time: isoDateTimeStart, end_time:isoDateTimeEnd})
      return 'Booking Update Successful!'
    }
  }
  else return 'Booking to update not found, try again.'
}

async function getOAuthCalendar(threadId) {
  const thread = await threadService.getThreadById(threadId); 
  let refreshToken;
  let business;
  let client;
  let name;
  if(thread){
    console.log('We got thread')
      business = await businessService.getBusinessById(thread.business_id);
      client = await bclientService.getBClientById(thread.client_id);
    if(business?.gcal_refresh_token){
      console.log('we got business')
      refreshToken = business.gcal_refresh_token;
    }

    if(client){
      console.log('we got client'); 
      name = client.name;
    }
  }

  console.log('refresh token is: ', refreshToken)

  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLEAPI_CLIENT_ID,
    process.env.GOOGLEAPI_CLIENT_SECRET,
    process.env.REDIRECT_URI 
  );

  if(oAuth2Client){
    console.log('we got the oAuth client too')
    oAuth2Client.setCredentials({ refresh_token: refreshToken });
    console.log('here is the oAuth Client: ', oAuth2Client)
  }
  const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
  return calendar;
}

async function getOrCreateNomoCalendar(calendar){
  const calendars = await calendar.calendarList.list();
  let nomoCalendar = calendars.data.items.find(c => c.summary === 'BizMitra_Scheduler');

  if (!nomoCalendar) {
    const created = await calendar.calendars.insert({
      requestBody: {
        summary: 'BizMitra_Scheduler',
        timeZone: 'Europe/London',
      },
    });
    nomoCalendar = created.data;

    // Add the calendar to the user's calendar list
    await calendar.calendarList.insert({ requestBody: { id: nomoCalendar.id } });
    console.log('created a new celndar instance');
  }
  return nomoCalendar;
}

export async function scheduleAppointment(threadId, description, isoDateTime, isoDateTimeEnd){
  
  const calendar = await getOAuthCalendar(threadId);
  const nomoCalendar = await getOrCreateNomoCalendar(calendar);

  const thread = await threadService.getThreadById(threadId); 
  let business;
  let client;
  let name;
  if(thread){
    console.log('We got thread')
      business = await businessService.getBusinessById(thread.business_id);
      client = await bclientService.getBClientById(thread.client_id);
      name = client?.name || "user";
  }
  
  const start = new Date(isoDateTime);
  const end = new Date(isoDateTimeEnd); 
  const freeBusy = await calendar.freebusy.query({
    requestBody: {
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      items: [{ id: nomoCalendar.id }],
    },
  });

  const busySlots = freeBusy.data.calendars[nomoCalendar.id].busy;

  if (busySlots.length > 0) {
    return 'Slot occupied, please try another';
  }

  const eventCreation = await calendar.events.insert({
    calendarId: nomoCalendar.id,
    requestBody: {
      summary: description + '// ' + name,
      start: {
        dateTime: start.toISOString(),
      },
      end: {
        dateTime: end.toISOString(),
      },
    },
  });

  if(eventCreation){
    const booking = await bookingService.createBooking({
      business_id: business.id,
      client_id: client.id,
      session_type: description,
      start_time: isoDateTime,
      end_time: isoDateTimeEnd,
      event_id: eventCreation.data.id,
      status: eventCreation.data.status,
    }); 
    if(booking){
      console.log('booking created in the backend');
    }                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
    return 'Booking successful!';
  }
  else return 'booking not successful, try again';
}