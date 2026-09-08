# Program Hub

Create a simple, clean web application with two sections: Admin and User/Client.

ADMIN LOGIN

Use a simple fixed Admin login. No complicated authentication is required.

Default credentials:

Username: ADMIN-THAMASSUK

Password: 1234

ADMIN PANEL

Admin can:

Add, edit, and delete Programs.

Create a unique Passcode for each Program.

Upload multiple materials/files for each Program.

Materials can be any file type such as PDF, PSD, DOC/DOCX, PPT/PPTX, images, videos, ZIP/RAR, etc.

Set allowed submission file extensions for each Program.

Allow multiple extensions, for example .pdf, .psd, .docx, .jpg.

View, download, and manage all submitted files.

See the Chest No. of each submission.

Change Program details, Passcodes, Materials, and allowed extensions.

USER / CLIENT PANEL

Show two main options:

1. ACCESS PROGRAM MATERIAL

User enters:

Program Passcode

If the passcode is correct:

Display the corresponding Program.

Display all materials uploaded by Admin.

Allow the user to view/download the materials.

If incorrect:

Show Invalid Passcode.

2. SUBMIT PROGRAM FILE

Create a submission form with:

Chest No.

Required input box.

User enters their Chest Number.

Example: THM001

Select Program

Dropdown containing all Programs added by Admin.

Upload File(s)

Allow the user to upload multiple files.

Only extensions allowed by Admin for the selected Program can be uploaded.

Show the allowed extensions clearly.

Reject unsupported file types.

Submit

After successful submission, show:

"Submission Successful"

ADMIN SUBMISSION VIEW

In the Admin Panel, show submissions in a table:

Chest No.ProgramFile NameFile TypeSubmission DateDownload

Admin should be able to search/filter submissions by:

Chest No.

Program

File type

Date

IMPORTANT

Each submission must be linked to the correct:

Program + Chest No. + Uploaded File(s)

The Chest No. is mandatory for every submission.

Users do not need to create an account.

Keep authentication and the overall system simple.

DESIGN

Use a modern, minimal, professional, mobile-friendly interface.

Admin:

Programs

Materials

Submission Settings

Submitted Files

User:

Access Materials

Submit Program File

Use clean cards, dropdowns, input boxes, buttons, file-upload areas, and clear success/error messages.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/db1e7a45-cc8b-4095-b3b6-a96b61a35f86).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
