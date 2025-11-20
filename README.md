# **Shred Test - Guitar Technique Tracker**

I created this React application to help my daughter track her practice progress, manage training plans, and visualize improvement over time. Built with **React**, **Vite**, and **Firebase**.

## **Features**

* **User Authentication**: Secure email/password login and registration via Firebase Auth.  
* **Cloud Sync**: All data is stored securely in Cloud Firestore, allowing access across multiple devices.  
* **Custom Practice Plans**: Create personalized training routines by selecting from a library of techniques (Legato, Tapping, Sweep Picking, etc.) inspired by my daughter's favourite guitar legends. You can add extra practice techniques by modifying the JSON schema in the app source code.
* **Progress Tracking**: Log daily metrics like Speed (BPM), Accuracy (%), Cleanliness, and Stamina.  
* **Visual Analytics**: View interactive charts (powered by Recharts) to analyze trends and week-over-week improvement.  
* **Export & Print**: Export data to CSV or generate printer-friendly reports of progress graphs.  

## ** Usage Guide**

### **Dashboard**

* **Weekly View**: Shows which days you have logged practice (marked with a green check).  
* **Logging**: Select a date and your current plan. Enter values for the specific metrics (e.g., 120 BPM) and click **Save Progress**.

### **Plans**

* **Create Plan**: Click "Create New Plan", name it (e.g., "Shred Routine"), and add techniques from the library.  
* **Edit/Delete**: You can modify plans at any time. *Note: Deleting a plan removes associated stats.*

### **Statistics**

* **Analysis**: Select a specific technique and metric (e.g., "Legato - Speed") to see a line graph of your progress.  
* **KPIs**: View your "All-Time Best" and "Progress vs Previous Session".  
* **Export**: Use the "Export CSV" button to download raw data or "Print" for a paper copy.