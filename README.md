# Keboola Writer for SFTP/WebDAV

A Keboola Connect Writer component that handles data writing from KBC storage to SFTP/WebDAV. Written in Node.js with focus on simplicity.

## Settings

SFTP/WebDAV Configuration is very straightforward. One has to choose whether the desired protocol is SFTP or WebDAV, select input files from Keboola Storage, put credentials and the SFTP/WebDAV Writer is all set. The possible options are described below.

### Table selection

A Keboola helper for Table Input Mapping selection is enabled. It's a GUI component that simplify the input table selection and enabled some advanced functionality like columns specification. Feel free to experiment with this.

### SFTP/WebDAV settings

The configuration structure for the SFTP/WebDAV Writer is very straightforward and there is a GUI helper that helps you to prepare the configuration. Check out the summary in the list below.

* Hostname - SFTP or WebDAV hostname.
* Username - SFTP or WebDAV username.
* Password - SFTP or WebDAV password, will be encrypted.
* Protocol - sftp/webdav. Default value set to sftp.
* Remote path - any remote path where the files will be uploaded. Default value set to '/'.
* Append datetime - true/false. Default value set to false.
* Trust unsecured certificate - true/false. Default value set to true.

### The default options

The required parameters are **Hostname**, **Username** and **Password**. There must be a non-empty value for each of these parameter in the input configuration. If not, the execution will failed. **Note**: hostname parameter should contain a port, in the form **domain:port**.
If you omit the port, a default ones for sftp/webdav are going to be applied.

The output may contain a datetime value (format: YYYY-MM-DD_HH:mm:ss). If there is an attribute **Append datetime** in cofiguration and contains **true** value, the output file(s) will contain that information.

Another attribute is called **Protocol**. The default value is **sftp**, which is used if this attribute is missing in configuration. The other option is **webdav** as described above.

The last option is related to WebDAV configuration and certificate trust verification. If there is a situation when your WebDAV server contains a certificate that is not properly secured and fails on cetificate trust verification (error: Peer certificate cannot be authenticated with known CA certificates), you won't be able to load any file by default. However, you can skip that checking by keeping parameter **Trust unsecured certificate** set to true.
