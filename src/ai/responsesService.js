import OpenAI from "openai";
import dotenv from 'dotenv';
import threadService from "../services/threadService.js";
import businessProfileService from "../services/businessProfileService.js";
import {createOwnerTask, rescheduleBooking, scheduleAppointment, getBusinessClientSchedule} from './tools.js';
import { response } from "express";
import moment from 'moment-timezone';
dotenv.config();

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});


const tools = [{
    type: "function",
    name: "create_owner_task",
    description: "Create a task (bTask) for the business owner for all queries and requests that you do not have the context to resolve. After creation of bTask, politely tell the user to wait for owner response",
    parameters: {
        type:"object",
        properties: {
            taskDescription: {
                type: "string",
                description: "Concisely define the task that the business owner needs to carry out to fulfil the request, ensure there is an objective for the owner."
            },
            priority: {
                type:"string",
                description:"Choose between medium, high and low - depending on the request, if it is time sensitive then make it high for everything else keep it low or medium"
            },
        },
        required: [
            "taskDescription",
            "priority"
        ],
        additionalProperties: false
    },
    strict: true
},
{
    type: "function",
    name: "schedule_appointment",
    description: "Schedule an appointment for any of the services in the business profile. The time each appointment lasts for is present in the services. Never call this function without first getting the exact in DD MMM YYYY format from the user. Make sure you have the information about day and time before calling. If any information is missing, first ask the customer and then call it.",
    parameters: {
        type:"object",
        properties: {
            appointmentDescription: {
                type: "string",
                description: "Concisely define what the appointment is for and for which service it is for. The function has a name variable already so add it like this - service (real service name) for ${name}"
            },
            isoStart: {
                type:"string",
                description:"The start time for the appointment as recieved from user, the format is 2025-07-05T11:00:00Z - this is standard, if there is information about business location then convert this standard time to that timezone (example: add 5.5 hours for India)"
            },
            isoEnd: {
                type:"string",
                description:"The end time for the appointment, check the business instructions for each service there should be an appointment time, if there isn't always put 1 hour as the end time. the format is 2025-07-05T11:00:00Z"
            },            
        },
        required: [
            "appointmentDescription",
            "isoStart",
            "isoEnd"
        ],
        additionalProperties: false
    },
    strict: true
}, 
// add reschedule and get business client schedule here 
{
    type: "function",
    name: "get_Client_Appointments",
    description: `Call this method to update or reschedule an appointment. You will recieve an array of booking details with each object containing the id, the description of the booking and start and end times. To reschedule follow this regime:
    1. Once you get the request you reschule/update the booking call this method and return ONLY the description and the times - asking for confirmation of which booking to udpate
    2. Then get the udpate details - new description, or new start and end times or dates.
    3. Once you know for sure, remember that and call reschedule_appointment function with the booking id of the booking to udpate, the new description or the start or the end time.`,
},
{
    type: "function",
    name: "reschedule_appointment",
    description: "Use this to reschedule a client's appointment after you have the information about the exact booking to update with stuff to update (new description, new end or start time or date) and the bookingID of the booking to update with get_Client_Appointments",
    parameters: {
        type:"object",
        properties: {
            // currentBookingTimeStart: {
            //     type:"string",
            //     description:"The current start time for the appointment or booking which needs to be updated as confirmed by the client. "
            // },
            // currentBookingTimeEnd: {
            //     type:"string",
            //     description:"The current end time for the appointment or booking which needs to be updated as confirmed by the client"
            // }, 
            bookingId: {
                type:"string",
                description:"Check the history for appointment details, match the booking the user wants to reschedule and send the bookingId from that list as this parameter, the function will find and amend the booking using this."
            },
            newAppointmentDescription: {
                type: "string",
                description: "Only if there's a need to udpate, don't include if not - Concisely define what the appointment is for and for which service it is for. The function has a name variable already so add it like this - service (real service name) for ${name} when referring to the client"
            },
            newBookingTimeStart: {
                type:"string",
                description:"The updated start time for the appointment as recieved from user, the format is 2025-07-05T11:00:00Z - this is standard, if there is information about business location then convert this standard time to that timezone (example: add 5.5 hours for India)"
            },
            newBookingTimeEnd: {
                type:"string",
                description:"The updated end time for the appointment, check the business instructions for each service there should be an appointment time, if there isn't always put 1 hour as the end time. the format is 2025-07-05T11:00:00Z"
            },            
        },
        required: [
            // "currentBookingTimeStart",
            // "currentBookingTimeEnd",
            "bookingId",
            "newAppointmentDescription",
            "newBookingTimeStart",
            "newBookingTimeEnd"
        ],
        additionalProperties: false
    },
    strict: true
},  
]

async function callFunction (threadId, name, args){
    if(name === 'create_owner_task'){
        console.log('we are in createOwnertask in call function')
        return await createOwnerTask(threadId, args.taskDescription, args.priority); 
    }
        if(name === 'schedule_appointment'){
        console.log('we are in createOwnertask in call function 2 ')
        return await scheduleAppointment(threadId, args.appointmentDescription, args.isoStart, args.isoEnd); 
    }
            if(name === 'reschedule_appointment'){
        console.log('we are in reschedule_appointment in call function 2 ')
        return await rescheduleBooking(threadId, args.bookingId, args.newAppointmentDescription, args.newBookingTimeStart, args.newBookingTimeEnd); 
    }
            if(name === 'get_Client_Appointments'){
        console.log('we are in createOwnertask in call function 2 ')
        return await getBusinessClientSchedule(threadId); 
    }
    
}

async function getAgentResponse (threadId, message) {
    const thread = await threadService.getThreadById(threadId);

    let history = [...thread.context];

    const newUserMessage = { role: 'user', content: message };
    history.push(newUserMessage);

    const prompt = `
    You are a WhatsApp assistant that helps small businesses respond to clients. Always be helpful, short, and friendly. Business info will be in the thread system message.
    Do not respond to any message that requests information outside of the business profile. If a user asks something genuine and you do not find the answer to the question in the instructions then simply say you will ask a human to pitch in and ask them to wait for this you should check the tool to create an owner task, for irrelevant messages simply say you cannot help with it
    `;

    const businessProfile = await businessProfileService.getProfileByBusinessId(thread.business_id);
    const currentDateTimeKolkata = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
    const timezoneInfo = `Current date and time in Asia/Kolkata timezone: ${currentDateTimeKolkata}.`;
    const instructions = prompt + businessProfile.system_prompt + timezoneInfo;

    const response = await client.responses.create({
        model: "gpt-4.1",
        input: history, 
        instructions: instructions,
        tools: tools
    });

    console.log('first response object: ', response.output); //delete this

    const result = await handleResponseOutput(response, threadId);

    history.push({role:"assistant", content: result});

    await threadService.updateThread(threadId, {context: history});

    console.log('string result ', result); //delete this
 
    return result;
}

async function handleResponseOutput(response, threadId) {

    threadService.updateThread(threadId, {previousResponse_id: response.id});
    const toolCalls = response.output;
    console.log('Here in the handle response: ', toolCalls); //delete this
    console.log('Here in the handle response for prev id : ', response.id); //delete this

    let history = [];

    for (const toolCall of toolCalls) {
        console.log('loop started')
        if (toolCall.type !== "function_call") {
            console.log('here in the message loop!')
            const responseFromAi = toolCall.content[0].text;
            return responseFromAi;
        }
        console.log('function call so not returning the output text yet');
        const name = toolCall.name;
        const args = JSON.parse(toolCall.arguments);

        console.log('the args ', args) //delete this

        const result = await callFunction(threadId, name, args);

        console.log('the result from function call: ', result) //delete this

        history.push({ 
            type: "function_call_output",
            call_id: toolCall.call_id,
            output: result 
        });

        console.log('the input in the next response call ', history) //delete this

        const responseAfterFunction = await client.responses.create({
            model: "gpt-4o-mini",
            input: history,
            previous_response_id: response.id,
            tools: tools
        });

        return await handleResponseOutput(responseAfterFunction, threadId);
    }
    
    // Fix: Add explicit return for when no tool calls are processed
    return "No response generated";
}

export async function businessDetailsFromWebsite(text) {
    const prompt = `
    You are an expert at extracting business information from website text to create detailed 'About Us/Services' section for an AI Chatbot which uses ths information to speak to the business's customers.
    Extract the following business details from the website text provided and create the About us and Services section - keep it concise and informative but effective.:
    1. About the business
    2. Services offered (with brief descriptions and prices if available)
    3. Any FAQs or important notes for customers, the way the business operates and 
    4. Any processes, anything that stands out about how the business operates, any questions that might come from visitors/leads. 
    5. Any other information that makes it easier for the business specific chatbot to interact with its visitors and convert them from leads to booking appointments or even sales.`

    const response = await client.responses.create({
        model: "gpt-4.1-nano",
        input: text, 
        instructions: prompt,
    });

    return response.output_text;

}

export default getAgentResponse;