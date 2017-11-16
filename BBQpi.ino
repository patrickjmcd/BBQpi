const int ledPin = 13;

#include <RCSwitch.h>

#define switch1on_CODE 37789696
#define switch2on_CODE 37785600
#define switch3on_CODE 37783552
#define switch1off_CODE 21012480
#define switch2off_CODE 21008384
#define switch3off_CODE 21006336

RCSwitch mySwitch = RCSwitch();

void setup()
{
  pinMode(ledPin, OUTPUT);
  
  Serial.begin(9600);
  mySwitch.enableTransmit(7);
  Serial.println("Setup Complete");
  
}

int meatTemp = 75;
int pitTemp = 75;
int heatingStatus = 0;
int deadband = 10;
int pitTempTarget = 250;
int meatTempTarget = 200;
boolean loopRead = false;
boolean switch1on = false;
boolean switch2on = false;
boolean switch3on = false;
char inData[20]; // Allocate some space for the string
char inChar=-1; // Where to store the character read
byte index = 0; // Index into array; where to store the character

char Comp(char* This) {
    while (Serial.available() > 0) // Don't read unless
                                   // there you know there is data
    {
        if(index < 19) // One less than the size of the array
        {
            inChar = Serial.read(); // Read a character
            inData[index] = inChar; // Store it
            index++; // Increment where to write next
            inData[index] = '\0'; // Null terminate the string
        }
    }

    if (strcmp(inData,This)  == 0) {
        for (int i=0;i<19;i++) {
            inData[i]=0;
        }
        index=0;
        return(0);
    }
    else {
        return(1);
    }
}




void loop()
{
  String startChar = "[";
  String endChar = "]";
  String splitChar = "--";
  String meatDeviceName = "meatTemp";
  String pitDeviceName = "pitTemp";
  String heatDeviceName = "heaterStatus";
  
  delay(2000);
  
  String readCommand = "";
  while (Serial.available()) {
    delay(3);                  //delay to allow buffer to fill
    if (Serial.available() > 0) {
      char c = Serial.read();  //reads one byte at a time from serial buffer
      readCommand += c;
    }
  }
  if (readCommand.length() > 0) {
    Serial.println("read: " + readCommand);
    Serial.print(readCommand[1]);
  }
  if (readCommand =="stop")
  {
    loopRead = false;
    Serial.println("Stopping");
    switch1on  = false;
    switch2on  = false;
    switch3on  = false;
    
  }
  
  if (readCommand == "start")
  {
    loopRead = true;
    Serial.println("Starting");
  }
  
  int spSeparator = readCommand.indexOf('#');
  if (spSeparator > 0) {
    String paramName = readCommand.substring(0,spSeparator);
    if (paramName == "meat")
    {
      String meatTempBuffer = readCommand.substring(spSeparator+1);
      char marray[meatTempBuffer.length() +1];
      meatTempBuffer.toCharArray(marray, sizeof(marray));
      meatTempTarget = atof(marray);
      Serial.println(meatTempTarget);
    }
    if (paramName == "pit")
    {
      String pitTempBuffer = readCommand.substring(spSeparator+1);
      char parray[pitTempBuffer.length() +1];
      pitTempBuffer.toCharArray(parray, sizeof(parray));
      pitTempTarget = atof(parray);
      Serial.println(pitTempTarget);
    }
    if (paramName == "deadband")
    {
      String dbBuffer = readCommand.substring(spSeparator+1);
      char dbarray[dbBuffer.length() +1];
      dbBuffer.toCharArray(dbarray, sizeof(dbarray));
      deadband = atof(dbarray);
      Serial.println(deadband);
    }
  }
  
  
  if (loopRead == true)
  {
    String meatOutput = startChar + meatDeviceName + splitChar + meatTemp + endChar;
    String pitOutput = startChar + pitDeviceName + splitChar + pitTemp + endChar;
    String heatOutput = startChar + heatDeviceName + splitChar + heatingStatus + endChar;
    Serial.println(meatOutput);
    Serial.println(pitOutput);
    Serial.println(heatOutput);
    
    if (heatingStatus == 1)
    {
      switch1on  = true;
      //switch2on  = true;
      //switch3on  = true;
      pitTemp = pitTemp + 3;
    } else {
      switch1on  = false;
      //switch2on  = false;
      //switch3on  = false;
      pitTemp--;
    }
    
    if (pitTemp > meatTemp)
    {
      meatTemp++;
    }
    
    if (pitTemp > pitTempTarget)
    {
      heatingStatus = 0;
    } 
    
    
    if (pitTemp < (pitTempTarget - deadband)) {
      heatingStatus = 1;
    }
  }
  
  if (switch1on == true)
  {
    mySwitch.send( switch1on_CODE , 26 );
  } else {
    mySwitch.send( switch1off_CODE , 26 );
  }
  
  if (switch2on == true)
  {
    mySwitch.send( switch2on_CODE , 26 );
  } else {
    mySwitch.send( switch2off_CODE , 26 );
  }
  
  if (switch3on == true)
  {
    mySwitch.send( switch3on_CODE , 26 );
  } else {
    mySwitch.send( switch3off_CODE , 26 );
  }

  if (Serial.available())
  {
     flash(Serial.read() - '0');
  }
  
}


void flash(int n)
{
  for (int i = 0; i < n; i++)
  {
    digitalWrite(ledPin, HIGH);
    delay(100);
    digitalWrite(ledPin, LOW);
    delay(100);
  }
}
