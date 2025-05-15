## Prepare to run the plugin on a server

1. Build the plugin using `npm install` and `npm run build`

2. Go to `plugin-jatos-group-chat/dist` and copy the file `index.browser.js`

3. Go to `test-jatos-group-chat/jspsych` and paste the file, rename to `plugin-jatos-group-chat.js`; replace any existing file by that name if prompted

## Run on local server

1. Locate where your `study-assets-root` folder is. When you open the page localhost:9000, you'll see the address.

2. Click on `Studies` > `New Study` on the JATOS server homepage. This will create a new folder in the `study-assets-root` folder, with a randomly generated UUID.

3. Copy the **content** of `test-jatos-group-chat` into this new folder (should have a `jspsych` folder and a `index.html` file).

4. On the JATOS server homepage, click on `Properties`, then make sure `Group Study` is toggled on.

5. Add the html file: Click on `New Component`, put in a title and the location of the `index.html` file. (If you're using the structure described above, then you should just type `index.html`.)

6. To test, press `Run`. To share with other people, click `Study Links`. Easiest option is to toggle on `General Multiple` (General --> many people can use the same link, Multiple --> one person can use one link many times). More information on [link types](https://www.jatos.org/Run-your-Study-with-Study-Links.html). Get the link by clicking on `Study Link` next to the link type you want.  

## Run on MindProbe server

This is a little annoying...

1. From the main page of the plugin on the JATOS local server, click `Export` and export as a .jzip file.

2. On MindProbe, click on `Studies` > `Import Study`. Then select the .jzip file you exported.

## Making changes to the plugin

If you make any changes to the .ts file, run `npm install` and `npm run build`. Then repeat steps 2 and 3 of the [Prepare to run...](#prepare-to-run-the-plugin-on-a-server) section. This will update the local server. 

You need to export the .jzip file and import to MindProbe if you want the change to reflect on MindProbe.