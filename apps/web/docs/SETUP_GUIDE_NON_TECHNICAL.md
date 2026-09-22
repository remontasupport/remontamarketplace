# 🚀 Complete Setup Guide - Zoho to Database Sync
### A Step-by-Step Guide for Non-Technical Users

---

## 📖 What This Guide Will Help You Do

This guide will help you set up an automatic system that:
- **Saves** contractor information from Zoho CRM to your database
- **Updates** the database automatically when you edit contacts in Zoho
- **Removes** (soft deletes) contractors from the database when you delete them in Zoho
- **Works in real-time** - changes sync within 3-5 seconds!

---

## 🎯 Overview - The Big Picture

Think of this system like a personal assistant that:
1. **Watches** your Zoho CRM for changes to contractor contacts
2. **Copies** the important information to your website's database
3. **Keeps everything in sync** automatically

**You create/edit/delete a contractor in Zoho → System automatically updates your database**

---

## ✅ Prerequisites (What You Need Before Starting)

- [ ] Access to Zoho CRM (with permissions to create workflows and functions)
- [ ] Your website is deployed (on Vercel or similar)
- [ ] Basic understanding of copying and pasting text
- [ ] 30-45 minutes of time

**Don't worry!** Each step includes detailed instructions with screenshots.

---

## 📋 Part 1: Understanding Your Database Structure

### What Information Gets Synced?

Your database stores **15 pieces of information** about each contractor:

#### Basic Information (4 fields)
-  **First Name** - Contractor's first name
- **Last Name** - Contractor's last name
- **Email** - Email address (must be unique)
- **Phone** - Phone number

#### Location (3 fields)
- **City** - Which city they're in
- **State** - Which state/province
- **Postal Code** - ZIP or postal code

#### Professional Details (2 fields)
- **Title/Role** - Their job title (e.g., "Cleaner", "Support Worker")
- **Years of Experience** - How many years they've worked (number)

#### Qualifications (3 fields)
- **Qualifications & Certifications** - Their credentials
- **Languages Spoken** - What languages they speak
- **Has Vehicle Access** - Yes/No if they have a vehicle

#### Personal Details (4 fields)
- **Fun Fact** - Something interesting about them
- **Hobbies & Interests** - What they enjoy doing
- **What Makes Business Unique** - Their unique selling point
- **Additional Information** - Any extra notes

#### Profile Image
- **Profile Photo** - Their profile picture (stored in cloud storage)

### System Fields (Added Automatically)
- **Created Date** - When the record was first created
- **Updated Date** - When it was last changed
- **Last Synced** - When it was last synced from Zoho
- **Deleted Date** - If/when it was deleted (null means active)

---

## 📋 Part 2: Setting Up Zoho Functions

### What are Deluge Functions?

**Think of Deluge functions like recipes:**
- A **recipe (function)** contains step-by-step instructions
- When you want to bake a cake (sync a contact), you follow the recipe
- Zoho follows your recipe automatically when contractors are created, updated, or deleted

### Function 1: Sync Contractor (Create/Update)

**Purpose:** This function sends contractor information to your database when contacts are created or edited.

#### Step-by-Step Instructions:

1. **Open Zoho CRM** in your web browser

2. **Click the gear icon** (⚙️) in the top right corner → Select **"Setup"**

3. **In the left sidebar**, find **"Developer Space"** → Click **"Functions"**

4. **Click the blue "+ Function" button** (top right)

5. **Fill in the form:**
   - **Function Name:** Type `syncContractorToDatabase`
   - **Display Name:** Type `Sync Contractor to Database`
   - **Description:** Type `Sends contractor data to database when created or updated`
   - **Category:** Select **"Automation"** from dropdown
   - **Return Type:** Will automatically show as `void`

6. **Click "Next"** or "Create"

7. **Add a Parameter:**
   - Click "+ Add Parameter"
   - **Parameter Name:** Type `contactId`
   - **Parameter Type:** Select **"string"**
   - Click "Done"

8. **In the code editor** (the big text box), delete any existing code and paste this:

```deluge
void Automation.syncContractorToDatabase(string contactId)
{
    // This is your website's webhook URL - replace with your actual URL
    webhookUrl = "https://YOUR-WEBSITE-URL.vercel.app/api/webhooks/zoho-contractor";

    // Prepare the data to send
    payload = Map();
    payload.put("module", "Contacts");
    payload.put("ids", {contactId});
    payload.put("operation", "update");

    // Set up headers (tells the server we're sending JSON data)
    headers = Map();
    headers.put("Content-Type", "application/json");

    // Send the data to your website
    response = invokeurl
    [
        url: webhookUrl
        type: POST
        parameters: payload
        headers: headers
    ];

    // Log what happened (for debugging)
    info "Webhook Response: " + response;
}
```

9. **IMPORTANT: Update the webhookUrl**
   - Find this line: `webhookUrl = "https://YOUR-WEBSITE-URL.vercel.app/api/webhooks/zoho-contractor";`
   - Replace `YOUR-WEBSITE-URL` with your actual Vercel website URL
   - Example: `webhookUrl = "https://mycontractors.vercel.app/api/webhooks/zoho-contractor";`

10. **Click "Save"**

11. **Configure Mapping:**
    - A popup will appear saying "One or more argument(s) are not mapped"
    - Click **"Configure Mapping"**
    - For `contactId` parameter:
      - **Module:** Select "Contacts"
      - **Field:** Select "Contact ID" or "Id"
    - Click "Save"

12. **Test the Function:**
    - Click "Execute" or "Test" button
    - Enter any contractor contact ID from Zoho
    - Click "Execute"
    - Check for "Success" message

✅ **Function 1 Complete!**

---

### Function 2: Delete Contractor (Soft Delete)

**Purpose:** This function marks contractors as deleted in your database when you delete them in Zoho.

#### Step-by-Step Instructions:

1. **Still in Zoho Functions**, click **"+ Function"** again

2. **Fill in the form:**
   - **Function Name:** `deleteContractorFromDatabase`
   - **Display Name:** `Delete Contractor from Database`
   - **Description:** `Marks contractor as deleted when removed from Zoho`
   - **Category:** **"Automation"**
   - **Return Type:** `void`

3. **Click "Next"**

4. **Add Parameter:**
   - Click "+ Add Parameter"
   - **Parameter Name:** `contactId`
   - **Parameter Type:** **"string"**

5. **Paste this code:**

```deluge
void Automation.deleteContractorFromDatabase(string contactId)
{
    // Your website URL - MUST match the one in the first function
    webhookUrl = "https://YOUR-WEBSITE-URL.vercel.app/api/webhooks/zoho-contractor";

    // Prepare delete request
    payload = Map();
    payload.put("module", "Contacts");
    payload.put("ids", {contactId});
    payload.put("operation", "delete");  // This tells the system to delete

    // Set headers
    headers = Map();
    headers.put("Content-Type", "application/json");

    // Send delete request
    response = invokeurl
    [
        url: webhookUrl
        type: POST
        parameters: payload
        headers: headers
    ];

    // Log the response
    info "Delete Response: " + response;
}
```

6. **Update the webhookUrl** (same as Function 1)

7. **Click "Save"**

8. **Configure Mapping:**
   - Click "Configure Mapping"
   - Map `contactId` to "Contact ID"
   - Save

✅ **Function 2 Complete!**

---

## 📋 Part 3: Setting Up Workflows

### What are Workflows?

**Think of workflows like automatic tasks:**
- **IF** this happens (create/edit/delete contact)
- **THEN** do this (run the function we just created)

### Workflow 1: Sync on Create/Update

**Purpose:** Automatically syncs contractors when you create or edit them.

#### Step-by-Step Instructions:

1. **In Zoho Setup**, find **"Automation"** in the left sidebar

2. **Click "Workflow Rules"**

3. **Click "+ Create Rule"** (blue button, top right)

4. **Basic Information:**
   - **Rule Name:** Type `Sync Contractor to Database`
   - **Module:** Select **"Contacts"**
   - **Description:** Type `Syncs contractor data when created or edited`

5. **When to Trigger (Execute on):**
   - Check **"Record is created"**
   - Check **"Record is edited"**

6. **Condition (Optional but Recommended):**
   - Click "+ Add Condition"
   - **Field:** Select "Contact Type" (or whatever field you use to identify contractors)
   - **Condition:** Select "is"
   - **Value:** Type "Contractor"
   - This ensures only contractors are synced, not all contacts

7. **Click "Next"**

8. **Add an Action:**
   - Click **"+ Action"**
   - Select **"Custom Functions"**
   - Choose the function we created: **"syncContractorToDatabase"**
   - For the parameter `contactId`, select **"Contact ID"** from the dropdown
   - Click "Save"

9. **Save the Workflow:**
   - Click "Save" at the bottom
   - **Toggle the workflow to "Active"** (switch in top right should be green/on)

✅ **Workflow 1 Complete!**

---

### Workflow 2: Sync on Delete

**Purpose:** Automatically marks contractors as deleted when you remove them from Zoho.

#### Step-by-Step Instructions:

1. **Still in Workflow Rules**, click **"+ Create Rule"**

2. **Basic Information:**
   - **Rule Name:** `Delete Contractor from Database`
   - **Module:** **"Contacts"**
   - **Description:** `Soft deletes contractor when removed from Zoho`

3. **When to Trigger:**
   - Check **"Record is deleted"** (ONLY this one)

4. **Condition:**
   - **Field:** "Contact Type"
   - **Condition:** "is"
   - **Value:** "Contractor"

5. **Click "Next"**

6. **Add Action:**
   - Click "+ Action"
   - Select **"Custom Functions"**
   - Choose **"deleteContractorFromDatabase"**
   - Map parameter to **"Contact ID"**
   - Save

7. **Save and Activate** the workflow

✅ **Workflow 2 Complete!**

---

## 📋 Part 4: Testing Your Setup

### Test 1: Create a New Contractor

1. **Go to Zoho CRM** → **Contacts**

2. **Click "+ New Contact"**

3. **Fill in the information:**
   - First Name: "Test"
   - Last Name: "Contractor"
   - Email: "test@example.com"
   - Contact Type: "Contractor"
   - Add any other fields you want

4. **Click "Save"**

5. **Wait 5-10 seconds**

6. **Check your database:**
   - If you're using Prisma Studio, refresh it
   - You should see "Test Contractor" appear!

✅ **If it appears, your CREATE sync is working!**

---

### Test 2: Update a Contractor

1. **Open the "Test Contractor"** contact you just created

2. **Edit any field** (change phone number, add city, etc.)

3. **Click "Save"**

4. **Wait 5-10 seconds**

5. **Refresh your database** - the changes should appear!

✅ **If changes appear, your UPDATE sync is working!**

---

### Test 3: Delete a Contractor

1. **Open the "Test Contractor"** contact

2. **Click the "Delete" button**

3. **Confirm deletion**

4. **Wait 5-10 seconds**

5. **Check your database:**
   - The contractor won't disappear completely
   - Look for a field called `deletedAt`
   - It should now have a date/time (marking it as deleted)
   - Your website won't show this contractor anymore because it's marked as deleted

✅ **If it has a deletedAt date, your DELETE sync is working!**

---

## 🎉 Congratulations!

Your Zoho to Database sync is now fully set up!

### What Happens Now?

**Every time you:**
- ✅ **Create** a new contractor in Zoho → Automatically added to database
- ✅ **Edit** a contractor in Zoho → Automatically updated in database
- ✅ **Delete** a contractor in Zoho → Automatically marked as deleted in database

### Next Steps

1. **Test with Real Data**: Try creating, editing, and deleting a few real contractors
2. **Monitor**: Check that data appears correctly on your website
3. **Go Live**: Once everything works, you're ready for production!

---

## 🆘 Troubleshooting

### Problem: Contractor doesn't appear in database

**Check:**
1. Is the workflow **Active** (green toggle)?
2. Did you wait 10 seconds after saving?
3. Did you set Contact Type = "Contractor"?
4. Check Zoho **Automation Logs** (Setup → Automation → Workflow Rules → click on your workflow → View Execution History)

**Solution:**
- Go to the workflow and check the execution logs
- Look for error messages
- Make sure the webhook URL is correct in your Deluge function

---

### Problem: Webhook URL error in Deluge function

**Error message:** "The endpoint your-ngrok-url.ngrok-free.dev is offline"

**Solution:**
- You need to update the `webhookUrl` in both Deluge functions
- It should be your actual Vercel production URL
- Example: `https://mywebsite.vercel.app/api/webhooks/zoho-contractor`

---

### Problem: Data appears but profile photo doesn't upload

**This is normal!**
- Photo uploads can take a bit longer
- Refresh your database after 15-20 seconds
- If still not appearing, check that the contact has a photo in Zoho

---

## 📚 Additional Resources

- **ZOHO_SYNC_COMPLETE.md** - Technical details and API documentation
- **WEBHOOK_TESTING_GUIDE.md** - Advanced testing instructions
- **apiGuidelines.md** - Production best practices

---

## 🎓 Glossary (Technical Terms Explained)

- **Webhook:** A way for Zoho to "call" your website and send data
- **API:** Application Programming Interface - how programs talk to each other
- **Deluge:** Zoho's programming language (like a recipe book for Zoho)
- **Workflow:** Automatic tasks that run when something happens
- **Soft Delete:** Marking something as deleted without actually removing it (keeps data for recovery)
- **Sync:** Making sure two places have the same data
- **Upsert:** Create if it doesn't exist, update if it does

---

**Document Version:** 1.0
**Last Updated:** 2025-10-10
**For Questions:** Contact your development team

