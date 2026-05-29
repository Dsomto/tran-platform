# Stage 1 — Task 1: AES-CBC ciphertext

The intern needs a real ciphertext to decrypt. Generate it once with the values
below, paste the output into a file called `aes-ciphertext.txt`, and put that
file in your Drive folder alongside this recipe.

## Recipe (paste into CyberChef)

**Plaintext (the message they will recover):**

```
sankofa-legacy-admin-takeover-2024
```

**Key (16 bytes, hex — AES-128):**

```
00112233445566778899AABBCCDDEEFF
```

**IV (16 bytes, hex):**

```
0102030405060708090A0B0C0D0E0F10
```

**CyberChef link to encrypt** (open this, click **Bake**, copy the output):

https://gchq.github.io/CyberChef/#recipe=AES_Encrypt(%7B'option':'Hex','string':'00112233445566778899AABBCCDDEEFF'%7D,%7B'option':'Hex','string':'0102030405060708090A0B0C0D0E0F10'%7D,'CBC','Raw','Hex')&input=c2Fua29mYS1sZWdhY3ktYWRtaW4tdGFrZW92ZXItMjAyNA

(That link pre-fills plaintext as base64, key as hex, IV as hex, mode CBC,
output hex. The result that pops out is the ciphertext.)

## What to put in the Drive folder

Save the ciphertext (a hex string) into `aes-ciphertext.txt` like this:

```
key (hex):  00112233445566778899AABBCCDDEEFF
iv  (hex):  0102030405060708090A0B0C0D0E0F10
mode:       AES-CBC
ciphertext (hex):
<paste the hex output from CyberChef here>
```

The intern's task says "decrypt this with the key/IV given" — they paste the
key, IV, ciphertext into CyberChef → AES Decrypt → mode CBC → and recover
"sankofa-legacy-admin-takeover-2024".
