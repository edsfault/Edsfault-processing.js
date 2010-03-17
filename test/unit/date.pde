// depend on current date, but may catch something
// e.g. removed functions

int y = year();
_checkTrue(y >= 2009 && y < 2100); // assume this is lifespan of the project 

int m = month();
_checkTrue(m >= 1 && m <= 12);

int d = day();
_checkTrue(d >= 1 && d <= 31);

int hh = hour();
_checkTrue(hh >= 0 && hh <= 23);

int mm = minute();
_checkTrue(mm >= 0 && mm <= 59);

int ss = second();
_checkTrue(ss >= 0 && ss <= 59);

int ms = millis();
_checkTrue(ms >= 0 && ms <= 300000); // this partucular test shall not run more than 5 minutes
