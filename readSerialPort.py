from time import sleep
from time import strftime
import serial

#MYSQL Config
import MySQLdb
db = MySQLdb.connect(	host="localhost",
			user="website",
			passwd="WebsiteMYSQL",
			db="BBQpi")
cur = db.cursor()

ser = serial.Serial('/dev/ttyUSB0', 9600) # Establish the connection on a specific port
counter = 32 # Below 32 everything in ASCII is gibberish
while True:
     counter +=1
     ser.write(str(chr(counter))) # Convert the decimal number to ASCII then send it to the Arduino
     serialLine = ser.readline()
     print serialLine # Read the newest output from the Arduino
#    if (serialLine.startswith("[") and serialLine.endswith("]")):
     splitLine = serialLine.split("--")
     print splitLine
     if splitLine[0].startswith("["):
          deviceName = splitLine[0].replace("[","")
          print "Device: "+ deviceName
          if splitLine[1].find("]") > 0:
               measurement = splitLine[1][0:splitLine[1].find("]")]
               print "Measurement: " + measurement 
               currentTime = strftime('%Y-%m-%d %H:%M:%S')
               print currentTime
               storeMeasurement = cur.execute("""INSERT INTO BBQpi.%s (measurement, measTime) VALUES ('%s', '%s');"""%(deviceName, measurement, currentTime)) 
               db.commit()

     sleep(.1) # Delay for one tenth of a second
     if counter == 255:
     	counter = 32
